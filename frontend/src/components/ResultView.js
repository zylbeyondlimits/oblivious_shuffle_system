import React, { useState, useMemo } from 'react';
import { Card, Button, Space, Modal, message, Empty, Switch, Tooltip } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { DownloadOutlined, PercentageOutlined, NumberOutlined } from '@ant-design/icons';
import AccessPatternAnalysis from './AccessPatternAnalysis';

const ResultView = ({ data, params }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [usePercentage, setUsePercentage] = useState(true);
  const [showRelative, setShowRelative] = useState(false);

  const chartContent = useMemo(() => {
    if (!data?.frequencies || !Array.isArray(data.frequencies)) {
      return null;
    }

    try {
      // 1. 获取所有位置
      const positions = [...new Set(data.frequencies.map(item => item.position))].sort((a, b) => a - b);
      
      // 2. 为每个位置准备数据
      const chartData = positions.map(pos => {
        // 获取当前位置的所有元素
        const positionData = data.frequencies
          .filter(item => item.position === pos)
          .sort((a, b) => b.frequency - a.frequency) // 按频率降序排序
          .slice(0, params.topK); // 只取前K个

        // 计算相对频率（如果启用）
        const totalFreq = positionData.reduce((sum, item) => sum + item.frequency, 0);
        
        // 创建该位置的数据对象
        const posData = { 
          position: `位置 ${pos}`,
          elements: positionData.map(item => ({
            element: item.element,
            frequency: item.frequency,
            percentage: item.frequency * 100,
            relativePercentage: (item.frequency / totalFreq) * 100
          }))
        };

        // 为图表添加每个元素的频率
        positionData.forEach((item, index) => {
          const value = showRelative ? 
            (item.frequency / totalFreq) * 100 : 
            (usePercentage ? item.frequency * 100 : item.frequency);
          
          posData[`element${index}`] = parseFloat(value.toFixed(4));
          posData[`elementName${index}`] = item.element;
        });

        return posData;
      });

      // 3. 计算Y轴范围
      const maxValue = Math.max(...chartData.flatMap(d => 
        Array.from({ length: params.topK }, (_, i) => d[`element${i}`] || 0)
      ));
      
      // 根据数据范围调整Y轴刻度
      const yAxisDomain = [0, showRelative ? 100 : Math.ceil(maxValue * 1.1)];

      return (
        <Card 
          title="位置分布分析" 
          style={{ marginTop: 16 }}
          extra={
            <Space>
              <Tooltip title="切换显示百分比/小数">
                <Switch
                  checkedChildren={<PercentageOutlined />}
                  unCheckedChildren={<NumberOutlined />}
                  checked={usePercentage}
                  onChange={setUsePercentage}
                />
              </Tooltip>
              <Tooltip title="切换相对频率显示">
                <Switch
                  checkedChildren="相对"
                  unCheckedChildren="绝对"
                  checked={showRelative}
                  onChange={setShowRelative}
                />
              </Tooltip>
            </Space>
          }
        >
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="position" />
              <YAxis 
                label={{ 
                  value: showRelative ? 
                    '相对频率 (%)' : 
                    (usePercentage ? '出现频率 (%)' : '出现频率'),
                  angle: -90, 
                  position: 'insideLeft' 
                }}
                domain={yAxisDomain}
              />
              <RechartsTooltip 
                formatter={(value, name, props) => {
                  const elementIndex = parseInt(name.replace('element', ''));
                  const elementName = props.payload[`elementName${elementIndex}`];
                  return [
                    `${value.toFixed(4)}${usePercentage || showRelative ? '%' : ''}`, 
                    `元素 ${elementName}`
                  ];
                }}
              />
              <Legend 
                formatter={(value, entry) => {
                  const elementIndex = parseInt(value.replace('element', ''));
                  return `Top ${elementIndex + 1}`;
                }}
              />
              {Array.from({ length: params.topK }).map((_, index) => (
                <Bar
                  key={`element${index}`}
                  dataKey={`element${index}`}
                  fill={`hsl(${(index * 360) / params.topK}, 70%, 50%)`}
                  name={`element${index}`}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      );
    } catch (error) {
      console.error('Error generating plot:', error);
      message.error('生成图表失败：' + error.message);
      return null;
    }
  }, [data, params.topK, usePercentage, showRelative]);

  const exportToCSV = () => {
    try {
      if (!data?.shuffledOnce) {
        message.error('没有可导出的数据');
        return;
      }

      const csvContent = [
        'Key,Value',
        ...data.shuffledOnce.map(item => {
          const [key, value] = item.split(':');
          return `${key},${value}`;
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `shuffled_result_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      message.success('导出成功');
    } catch (error) {
      console.error('Export error:', error);
      message.error('导出失败：' + error.message);
    }
  };

  if (!data || !data.frequencies) {
    return (
      <Card title="结果分析" className="result-view-card">
        <Empty description="暂无分析结果" />
      </Card>
    );
  }

  return (
    <Card title="打乱结果分析" className="result-view-card">
      <Space direction="vertical" style={{ width: '100%' }}>
        {chartContent}
        
        <Space>
          <Button
            onClick={() => setShowAnalysis(true)}
          >
            查看访问模式分析
          </Button>
          
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportToCSV}
            disabled={!data?.shuffledOnce}
          >
            导出单次打乱结果
          </Button>
        </Space>

        <Modal
          title="访问模式分析"
          open={showAnalysis}
          onCancel={() => setShowAnalysis(false)}
          width={800}
          footer={null}
        >
          <AccessPatternAnalysis />
        </Modal>
      </Space>
    </Card>
  );
};

export default ResultView;