import React, { useState } from 'react';
import { Layout, message } from 'antd';
import DataInput from './components/DataInput';
import ParamSettings from './components/ParamSettings';
import ResultView from './components/ResultView';
import 'antd/dist/antd.css';
import './App.css';

const { Header, Content } = Layout;

function App() {
  const [params, setParams] = useState({
    numRuns: 1000,
    topK: 5
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleShuffle = async (data, isFileMode) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/shuffle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          numRuns: params.numRuns,
          isFileMode: isFileMode
        }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      if (result.success) {
        // 确保数据格式正确
        setResults({
          frequencies: result.frequencies || [],
          shuffledOnce: result.shuffledOnce || []
        });
        
        message.success(isFileMode ? 
          `成功处理 ${data.length} 条数据，请查看分析结果` : 
          '打乱完成');
      } else {
        message.error(result.error || '处理失败');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('请求失败：' + error.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout className="layout">
      <Header>
        <h1 style={{ color: 'white' }}>加密数据随机打乱系统</h1>
      </Header>
      <Content style={{ padding: '50px' }}>
        <div className="site-layout-content">
          <DataInput onSubmit={handleShuffle} loading={loading} />
          <ParamSettings 
            value={params} 
            onChange={setParams} 
            disabled={loading}
          />
          {results && (
            <ResultView 
              data={results} 
              loading={loading}
              params={params}
            />
          )}
        </div>
      </Content>
    </Layout>
  );
}

export default App;