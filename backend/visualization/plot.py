import matplotlib
# 在导入 pyplot 之前设置后端为 Agg（非交互式后端）
matplotlib.use('Agg')
# 设置中文字体
matplotlib.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'Microsoft YaHei']  # 优先使用这些字体
matplotlib.rcParams['axes.unicode_minus'] = False  # 解决负号显示问题
import matplotlib.pyplot as plt
import seaborn as sns
import base64
from io import BytesIO
import numpy as np
import platform

# 根据操作系统设置合适的中文字体
def set_chinese_font():
    system = platform.system()
    if system == 'Windows':
        plt.rcParams['font.sans-serif'] = ['SimHei']  # Windows的中文字体
    elif system == 'Darwin':  # macOS
        plt.rcParams['font.sans-serif'] = ['Arial Unicode MS']
    elif system == 'Linux':
        plt.rcParams['font.sans-serif'] = ['DejaVu Sans']  # Linux的中文字体
    plt.rcParams['axes.unicode_minus'] = False

class ShuffleVisualizer:
    @staticmethod
    def plot_position_frequencies(positions, top_k=None):
        """
        绘制位置频率分布图
        :param positions: 位置频率数据
        :param top_k: 只显示频率最高的前k个元素
        :return: base64编码的图像
        """
        try:
            # 设置中文字体
            set_chinese_font()
            
            # 清理之前的图表
            plt.clf()
            
            # 数据预处理
            elements = set()
            positions_set = set()
            for pos in positions:
                elements.add(pos['element'])
                positions_set.add(pos['position'])

            # 创建频率矩阵
            freq_matrix = np.zeros((len(elements), len(positions_set)))
            element_list = sorted(list(elements))
            
            # 填充频率矩阵
            for pos in positions:
                i = element_list.index(pos['element'])
                j = pos['position']
                freq_matrix[i][j] = pos['frequency']

            # 如果指定了top_k，选择总频率最高的k个元素
            if top_k and top_k > 0 and top_k < len(element_list):
                # 计算每个元素的总频率
                total_frequencies = np.sum(freq_matrix, axis=1)
                # 获取前k个最高频率的索引
                top_indices = np.argsort(total_frequencies)[-top_k:]
                # 筛选数据
                freq_matrix = freq_matrix[top_indices]
                element_list = [element_list[i] for i in top_indices]

            # 创建图表
            plt.figure(figsize=(12, 8))
            
            # 调整热力图参数以优化显示效果
            sns.heatmap(
                freq_matrix,
                annot=True,
                fmt='.2%',
                cmap='YlOrRd',
                xticklabels=[f'位置 {i}' for i in range(len(positions_set))],
                yticklabels=element_list,
                cbar_kws={'label': '频率'},
                annot_kws={'size': 8}  # 调整注释文字大小
            )

            plt.title('元素在各位置的出现频率分布', fontsize=12, pad=20)
            plt.xlabel('位置', fontsize=10)
            plt.ylabel('元素', fontsize=10)

            # 调整布局以防止标签被切割
            plt.tight_layout()

            # 将图表转换为base64字符串
            buffer = BytesIO()
            plt.savefig(buffer, format='png', bbox_inches='tight', dpi=300)
            buffer.seek(0)
            image_png = buffer.getvalue()
            buffer.close()
            
            # 清理图表资源
            plt.close('all')

            return base64.b64encode(image_png).decode()

        except Exception as e:
            print(f"生成图表时出错: {str(e)}")
            # 确保清理所有图表资源
            plt.close('all')
            return None