from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from crypto.aes_crypto import AESCrypto
from shuffle.oblivious import ObliviousShuffle
from visualization.plot import ShuffleVisualizer
from Crypto.Random import get_random_bytes
import json
import time

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class KeyValueShuffler:
    def __init__(self, key):
        self.crypto = AESCrypto(key)
        self.shuffler = ObliviousShuffle()

    def encrypt_and_shuffle_api(self, data, num_runs):
        try:
            encrypted_data = []
            for item in data:
                if isinstance(item, dict) and 'key' in item and 'value' in item:
                    combined_text = f"{item['key']}:{item['value']}"
                    encrypted = self.crypto.encrypt(combined_text)
                    encrypted_data.append(encrypted)
            
            frequencies = {}
            for _ in range(num_runs):
                shuffled_data = encrypted_data[:]
                self.shuffler.or_shuffle(shuffled_data)
                for i, item in enumerate(shuffled_data):
                    decrypted = self.crypto.decrypt(item['iv'], item['ciphertext'])
                    if decrypted not in frequencies:
                        frequencies[decrypted] = [0] * len(encrypted_data)
                    frequencies[decrypted][i] += 1
            
            # 确保返回正确的数据格式
            result = []
            for k, v in frequencies.items():
                for i in range(len(v)):
                    result.append({
                        'element': k,
                        'position': i,
                        'frequency': v[i]/num_runs if num_runs > 0 else 0
                    })
            return result
        except Exception as e:
            logger.error(f"Encryption and shuffle error: {str(e)}")
            return []

@app.route('/api/shuffle', methods=['POST'])
def shuffle_data():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': '没有提供数据'}), 400
            
        pairs = data.get('data', [])
        num_runs = data.get('numRuns', 1)
        
        if not pairs:
            return jsonify({'success': False, 'error': '无效的数据格式'}), 400
            
        key = get_random_bytes(16)
        shuffler = KeyValueShuffler(key)

        try:
            frequencies = shuffler.encrypt_and_shuffle_api(pairs, num_runs)
            
            # 生成单次洗牌结果
            encrypted_data = [
                shuffler.crypto.encrypt(f"{item['key']}:{item['value']}") 
                for item in pairs
            ]
            shuffler.shuffler.or_shuffle(encrypted_data)
            shuffled_once = [
                shuffler.crypto.decrypt(item['iv'], item['ciphertext']) 
                for item in encrypted_data
            ]

            # 记录访问模式
            total_stats = {
                'total_accesses': 0,
                'real_accesses': 0,
                'dummy_accesses': 0,
                'access_sequence': []
            }

            # 执行多次打乱并累积统计
            for run in range(num_runs):
                encrypted_data = [
                    shuffler.crypto.encrypt(f"{item['key']}:{item['value']}")
                    for item in pairs
                ]
                shuffler.shuffler.or_shuffle(encrypted_data)
                
                run_stats = shuffler.shuffler.get_access_stats()
                total_stats['total_accesses'] += run_stats.get('total_accesses', 0)
                total_stats['real_accesses'] += run_stats.get('real_accesses', 0)
                total_stats['dummy_accesses'] += run_stats.get('dummy_accesses', 0)
                total_stats['access_sequence'].extend(run_stats.get('access_sequence', []))
                
                shuffler.shuffler.__init__()

            # 计算平均值
            if num_runs > 0:
                total_stats['total_accesses'] //= num_runs
                total_stats['real_accesses'] //= num_runs
                total_stats['dummy_accesses'] //= num_runs
            
            # 只保留最后1000个访问序列
            total_stats['access_sequence'] = total_stats['access_sequence'][-1000:]
            
            # 保存访问模式数据
            with open('access_patterns.json', 'w') as f:
                json.dump(total_stats, f)

            logger.info(f"Shuffled frequencies count: {len(frequencies)}")
            logger.info(f"Shuffled once count: {len(shuffled_once)}")

            return jsonify({
                'success': True,
                'frequencies': frequencies,
                'shuffledOnce': shuffled_once
            })

        except Exception as e:
            logger.error(f"Shuffling error: {str(e)}")
            return jsonify({
                'success': False,
                'error': f'洗牌过程出错: {str(e)}'
            }), 500

    except Exception as e:
        logger.error(f"处理过程中出错: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/access-patterns', methods=['GET'])
def get_access_patterns():
    try:
        try:
            with open('access_patterns.json', 'r') as f:
                access_patterns = json.load(f)
        except FileNotFoundError:
            access_patterns = {
                'total_accesses': 0,
                'real_accesses': 0,
                'dummy_accesses': 0,
                'access_sequence': []
            }
        
        return jsonify({
            'success': True,
            'data': access_patterns
        })
    except Exception as e:
        logger.error(f"获取访问模式数据时出错: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    print("正在启动 Flask 服务器...")
    print("访问地址: http://localhost:5001")
    try:
        app.run(host='0.0.0.0', port=5001, debug=True)
    finally:
        # 确保在退出时清理资源
        import multiprocessing
        if hasattr(multiprocessing, '_resource_tracker'):
            multiprocessing._resource_tracker._resource_tracker.clear()