import React from 'react';
import { Card, Form, InputNumber, Space, Tooltip } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const ParamSettings = ({ value, onChange, disabled }) => {
  const handleChange = (key, newValue) => {
    onChange({ ...value, [key]: newValue });
  };

  return (
    <Card 
      title={
        <Space>
          参数设置
          <Tooltip title="设置打乱算法的运行参数">
            <QuestionCircleOutlined />
          </Tooltip>
        </Space>
      } 
      className="param-settings-card"
    >
      <Form layout="vertical">
        <Form.Item 
          label={
            <Space>
              运行次数
              <Tooltip title="执行打乱算法的次数，次数越多统计结果越准确">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
        >
          <InputNumber
            min={1}
            max={500000}
            step={100}
            value={value.numRuns}
            onChange={val => handleChange('numRuns', val)}
            disabled={disabled}
            formatter={value => `${value} 次`}
            parser={value => value.replace(' 次', '')}
          />
        </Form.Item>

        <Form.Item 
          label={
            <Space>
              显示Top-K
              <Tooltip title="显示每个位置出现频率最高的前K个元素">
                <QuestionCircleOutlined />
              </Tooltip>
            </Space>
          }
        >
          <InputNumber
            min={1}
            max={100000}
            value={value.topK}
            onChange={val => handleChange('topK', val)}
            disabled={disabled}
            formatter={value => `前 ${value} 个`}
            parser={value => value.replace('前 ', '').replace(' 个', '')}
          />
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ParamSettings;