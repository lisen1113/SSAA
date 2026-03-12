## 任务描述
删除Surface Laptop 商用版, Windows 11 AI+ PC, 13.8和15英寸 | Intel产品的颜色选项中的"罗兰紫"。

## 具体修改
在`productConfigMap`对象中，找到`surface-laptop-15-intel`产品的配置，将颜色选项从：
```javascript
colors: ['亮铂金', '典雅黑', '罗兰紫']
```
修改为：
```javascript
colors: ['亮铂金', '典雅黑']
```

## 影响范围
- 仅影响Surface Laptop 商用版, Windows 11 AI+ PC, 13.8和15英寸 | Intel产品的颜色选择
- 其他产品的颜色选项保持不变
- 确保用户在选择该产品时不会看到"罗兰紫"颜色选项