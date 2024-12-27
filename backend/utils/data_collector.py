import requests
import json
import csv
import time
import random
from concurrent.futures import ThreadPoolExecutor
from tqdm import tqdm

class LargeDataCollector:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        self.collected_data = []
        
    def fetch_github_repos(self, page, per_page=100):
        """从GitHub API获取仓库数据"""
        url = f'https://api.github.com/repositories?since={page*per_page}'
        try:
            response = requests.get(url, headers=self.headers)
            if response.status_code == 200:
                repos = response.json()
                return [{'key': str(repo['id']), 'value': repo['full_name']} for repo in repos]
        except Exception as e:
            print(f"获取GitHub数据失败: {e}")
        return []

    def fetch_random_words(self, count=100):
        """从随机词API获取数据"""
        url = f'https://random-word-api.herokuapp.com/word?number={count}'
        try:
            response = requests.get(url)
            if response.status_code == 200:
                words = response.json()
                return [{'key': str(i), 'value': word} for i, word in enumerate(words)]
        except Exception as e:
            print(f"获取随机词失败: {e}")
        return []

    def generate_synthetic_data(self, count=1000):
        """生成合成数据"""
        data = []
        for i in range(count):
            key = f"synthetic_{i}"
            value = ''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=random.randint(5, 20)))
            data.append({'key': key, 'value': value})
        return data

    def collect_large_dataset(self, target_size=50000):
        """收集大规模数据集"""
        print(f"开始收集约 {target_size} 条数据...")
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            # 并行收集数据
            futures = []
            
            # 从GitHub API收集数据
            for page in range(10):
                futures.append(executor.submit(self.fetch_github_repos, page))
                time.sleep(0.1)  # 避免触发API限制
            
            # 收集随机词数据
            for _ in range(5):
                futures.append(executor.submit(self.fetch_random_words, 1000))
                time.sleep(0.1)
            
            # 使用进度条显示收集进度
            with tqdm(total=len(futures), desc="收集数据中") as pbar:
                for future in futures:
                    self.collected_data.extend(future.result())
                    pbar.update(1)
        
        # 如果收集的数据不够，补充合成数据
        remaining = target_size - len(self.collected_data)
        if remaining > 0:
            print(f"补充 {remaining} 条合成数据...")
            self.collected_data.extend(self.generate_synthetic_data(remaining))
        
        # 确保数据量不超过目标大小
        self.collected_data = self.collected_data[:target_size]
        
        # 确保键的唯一性
        unique_data = {}
        for item in self.collected_data:
            if item['key'] not in unique_data:
                unique_data[item['key']] = item['value']
        
        # 转换回列表格式
        self.collected_data = [{'key': k, 'value': v} for k, v in unique_data.items()]
        
        return self.collected_data

    def save_to_csv(self, filename='large_dataset.csv'):
        """保存数据到CSV文件"""
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=['key', 'value'])
                writer.writeheader()
                writer.writerows(self.collected_data)
            print(f"成功保存 {len(self.collected_data)} 条数据到 {filename}")
        except Exception as e:
            print(f"保存数据失败: {e}")

def main():
    # 安装所需依赖
    # pip install requests tqdm

    collector = LargeDataCollector()
    
    # 收集数据
    data = collector.collect_large_dataset(1000)
    
    # 保存数据
    collector.save_to_csv('large_dataset_1k.csv')
    
    # 打印统计信息
    print(f"\n数据集统计信息:")
    print(f"总条数: {len(data)}")
    print(f"唯一键数量: {len(set(item['key'] for item in data))}")
    print(f"平均值长度: {sum(len(str(item['value'])) for item in data) / len(data):.2f}")

if __name__ == '__main__':
    main() 