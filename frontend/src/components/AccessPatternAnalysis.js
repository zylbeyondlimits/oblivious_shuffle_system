import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Spin, Alert, Tooltip, Button } from 'antd';
import { QuestionCircleOutlined, ReloadOutlined } from '@ant-design/icons';

const AccessPatternAnalysis = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAccessPatterns = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5001/api/access-patterns');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.success) {
                setData(result.data);
            } else {
                throw new Error(result.error || '获取数据失败');
            }
        } catch (error) {
            console.error('Error fetching access patterns:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 初始加载
    useEffect(() => {
        fetchAccessPatterns();
        return () => {
            // 组件卸载时清理数据
            setData(null);
            setError(null);
        };
    }, []);

    if (loading) {
        return <Spin tip="加载中..." />;
    }

    if (error) {
        return <Alert type="error" message={error} />;
    }

    if (!data) {
        return <Alert type="info" message="暂无访问模式数据" />;
    }

    // 计算混淆比率
    const obfuscationRatio = data.dummy_accesses / (data.real_accesses || 1);

    return (
        <div>
            <Row justify="end" style={{ marginBottom: 16 }}>
                <Button 
                    icon={<ReloadOutlined />} 
                    onClick={fetchAccessPatterns}
                    loading={loading}
                >
                    刷新数据
                </Button>
            </Row>
            
            <Row gutter={16}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title={
                                <span>
                                    总访问次数
                                    <Tooltip title="所有内存访问操作的总次数">
                                        <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                                    </Tooltip>
                                </span>
                            }
                            value={data.total_accesses || 0}
                            suffix="次"
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title={
                                <span>
                                    真实访问
                                    <Tooltip title="实际需要的内存访问次数">
                                        <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                                    </Tooltip>
                                </span>
                            }
                            value={data.real_accesses || 0}
                            suffix="次"
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title={
                                <span>
                                    虚假访问
                                    <Tooltip title="为混淆真实访问而添加的额外访问次数">
                                        <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                                    </Tooltip>
                                </span>
                            }
                            value={data.dummy_accesses || 0}
                            suffix="次"
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title={
                                <span>
                                    访问混淆比
                                    <Tooltip title="虚假访问与真实访问的比率，反映了混淆的程度">
                                        <QuestionCircleOutlined style={{ marginLeft: 8 }} />
                                    </Tooltip>
                                </span>
                            }
                            value={obfuscationRatio.toFixed(2)}
                            suffix=":1"
                            precision={2}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AccessPatternAnalysis;