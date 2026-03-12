const { exec } = require('child_process');

console.log('测试Ollama命令...');

// 测试ollama版本
console.log('1. 测试ollama版本:');
exec('ollama --version', (error, stdout, stderr) => {
    if (error) {
        console.error('ollama --version 失败:', error);
    } else {
        console.log('成功:', stdout.trim());
    }
    
    // 测试ollama list
    console.log('\n2. 测试ollama list:');
    exec('ollama list', (error, stdout, stderr) => {
        if (error) {
            console.error('ollama list 失败:', error);
        } else {
            console.log('成功:', stdout.trim());
        }
        
        // 测试简单的ollama run命令
        console.log('\n3. 测试ollama run 简单命令:');
        const child = exec('ollama run llama2:7b', {
            timeout: 30000
        }, (error, stdout, stderr) => {
            if (error) {
                console.error('ollama run 失败:', error);
            } else {
                console.log('成功，输出:', stdout.trim().substring(0, 200) + '...');
            }
        });
        
        // 写入简单的输入
        child.stdin.write('你好\n');
        child.stdin.end();
        
        console.log('已向Ollama发送输入: 你好');
    });
});
