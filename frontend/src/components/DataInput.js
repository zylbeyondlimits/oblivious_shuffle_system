import React, { useState } from 'react';
import { Form, Input, Button, Space, Card, message, Upload, Tabs } from 'antd';
import { MinusCircleOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import Papa from 'papaparse';

const { TabPane } = Tabs;

// 将格式化函数定义在组件外部
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const DataInput = ({ onSubmit, loading }) => {
  const [form] = Form.useForm();
  const [fileSize, setFileSize] = useState(0);

  const handleFileUpload = (file) => {
    // 立即更新文件大小显示
    setFileSize(file.size);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        if (file.type !== 'text/csv') {
          throw new Error('只支持 CSV 文件');
        }

        Papa.parse(e.target.result, {
          header: true,
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const formattedData = results.data
                .filter(row => row.key && row.value)
                .map(row => ({
                  key: row.key.toString(),
                  value: row.value.toString()
                }));

              if (formattedData.length === 0) {
                message.error('没有有效的数据行');
                return;
              }

              message.success(`成功解析 ${formattedData.length} 条数据，开始处理...`);
              onSubmit(formattedData, true);
            } else {
              message.error('文件内容为空');
            }
          },
          error: (error) => {
            message.error(`文件解析失败：${error.message}`);
          }
        });
      } catch (error) {
        message.error(`文件处理失败：${error.message}`);
      }
    };

    reader.readAsText(file);
    return false;
  };

  const handleManualSubmit = (values) => {
    try {
      if (!values || !values.pairs) {
        throw new Error('表单数据无效');
      }

      const validPairs = values.pairs.filter(pair => pair && pair.key && pair.value);
      if (validPairs.length === 0) {
        throw new Error('请至少输入一组有效的键值对');
      }

      onSubmit(validPairs, false);
    } catch (error) {
      message.error(error.message);
    }
  };

  return (
    <Card title="数据输入" className="data-input-card">
      <Tabs defaultActiveKey="manual">
        <TabPane tab="手动输入" key="manual">
          <Form
            form={form}
            onFinish={handleManualSubmit}
            initialValues={{ pairs: [{ key: '', value: '' }] }}
          >
            <Form.List name="pairs">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item
                        {...restField}
                        name={[name, 'key']}
                        rules={[{ required: true, message: '请输入键' }]}
                      >
                        <Input placeholder="键" disabled={loading} />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'value']}
                        rules={[{ required: true, message: '请输入值' }]}
                      >
                        <Input placeholder="值" disabled={loading} />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined onClick={() => remove(name)} disabled={loading} />
                      )}
                    </Space>
                  ))}
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      disabled={loading}
                    >
                      添加键值对
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                开始打乱
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
        
        <TabPane tab="文件导入" key="file">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Upload.Dragger
              beforeUpload={handleFileUpload}
              showUploadList={false}
              accept=".csv"
              disabled={loading}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽 CSV 文件到此区域</p>
              <p className="ant-upload-hint">
                支持大规模数据集，建议文件大小不超过 10MB
              </p>
            </Upload.Dragger>
            {fileSize > 0 && (
              <div style={{ textAlign: 'center' }}>
                文件大小: {formatFileSize(fileSize)}
              </div>
            )}
          </Space>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default DataInput;