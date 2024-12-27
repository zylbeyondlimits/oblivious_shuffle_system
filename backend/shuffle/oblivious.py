import random
import math
import time
from collections import defaultdict

class ObliviousShuffle:
    def __init__(self):
        # 添加访问模式记录,但不影响原有功能
        self.access_patterns = []
        self.dummy_count = 0
        self.real_count = 0
    
    def record_access(self, index, is_dummy=False):
        """记录数据访问"""
        self.access_patterns.append({
            'timestamp': time.time(),
            'index': index,
            'type': 'dummy' if is_dummy else 'real'
        })
        if is_dummy:
            self.dummy_count += 1
        else:
            self.real_count += 1

    def o_swap(self, array, i, j, swap_flag):
        """改进的交换操作，确保至少2:1的混淆比例"""
        # 记录真实访问
        self.record_access(i)
        self.record_access(j)
        
        # 保证每次真实访问至少对应4次虚拟访问，确保2:1的最小混淆比例
        # 对于较大的数组可以增加更多虚拟访问
        base_dummy_count = 4  # 基础虚拟访问次数
        extra_dummy_count = min(2, len(array) // 4)  # 额外的虚拟访问
        total_dummy_count = base_dummy_count + extra_dummy_count
        
        # 执行虚拟访问
        for _ in range(total_dummy_count):
            dummy_idx = random.randint(0, len(array)-1)
            self.record_access(dummy_idx, True)
            _ = array[dummy_idx]  # 实际进行虚拟访问

        # 执行实际的交换操作
        if swap_flag:
            array[i], array[j] = array[j], array[i]

    def get_access_stats(self):
        """获取访问统计信息"""
        return {
            'total_accesses': len(self.access_patterns),
            'real_accesses': self.real_count,
            'dummy_accesses': self.dummy_count,
            'access_sequence': self.access_patterns
        }

    def power_of_two_floor_log(self, n):
        floor_log2 = math.floor(math.log2(n))
        return 2 ** floor_log2
    
    def or_off_compact(self, D, M, z, start, end):
        """辅助压缩函数，将 D 中被标记的元素移动到偏移 z 开始的位置"""
        n = end - start
        if n <= 1:
            return
        
        m = sum(M[:n // 2])  # 计算左半部分的标记元素数量

        if n == 2:
            # 如果只有两个元素，基于标记和偏移决定交换
            self.o_swap(D, start, start + 1, ((1 - M[0]) * M[1]) ^ z)
        elif n > 2:
            # 递归压缩左右两半
            self.or_off_compact(D, M[:n // 2], z % (n // 2), start, start + n // 2)
            self.or_off_compact(D, M[n // 2:], (z + m) % (n // 2), start + n // 2, end)

            # 计算条件量 s，用于控制条交换
            s = ((z % (n // 2)) + m >= n // 2) ^ (z >= n // 2)
            for i in range(n // 2):
                b = s ^ (i >= (z + m) % (n // 2))
                self.o_swap(D, start + i, start + i + n // 2, b)

    def or_compact(self, D, M, start=0, end=None):
        """主压缩函数，将 D 中的标记元素移动到前部"""
        if end is None:
            end = len(D)
        n = end - start
        if n == 0:
            return
        
        n1 = self.power_of_two_floor_log(n)  # 找到最接近 n 的 2 的幂
        n2 = n - n1
        m = sum(M[:n2])

        # 压缩左侧和右侧，并且在左侧填充偏移
        self.or_compact(D, M[:n2], start, start + n2)
        self.or_off_compact(D, M[n2:], (n1 - n2 + m) % n1, start + n2, end)
        for i in range(n2):
            self.o_swap(D, start + i, start + i + n1, i >= m)

    def mark_half(self, n):
        """生成一个布尔数组，随机标记一半的元素"""
        M = [0] * n
        l = (n + 1) // 2  # 标记元素数量

        for i in range(n):
            r = random.random()
            if r < l / (n - i):
                M[i] = 1
                l -= 1

        return M

    def or_shuffle(self, D, start=0, end=None):
        """优化的递归打乱函数"""
        if end is None:
            end = len(D)
        n = end - start
        
        # 对于很小的数组，简化处理
        if n <= 1:
            return
        elif n == 2:
            # 两元素情况下随机交换
            b = random.randint(0, 1)
            self.o_swap(D, start, start + 1, b)
        else:
            # 生成随机标记数组并将标记的元素移动到数组前一半
            M = self.mark_half(n)
            self.or_compact(D, M, start, end)
            # 递归地对前半部分和后半部分继续打乱
            mid = start + (n + 1) // 2
            self.or_shuffle(D, start, mid)
            self.or_shuffle(D, mid, end)