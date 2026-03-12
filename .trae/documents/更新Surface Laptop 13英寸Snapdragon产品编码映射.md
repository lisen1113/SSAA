## 更新Surface Laptop 13英寸Snapdragon产品编码映射

### 背景
用户提供了Surface Laptop 13英寸Snapdragon产品的最新信息，包括产品编码、配置和ERP价格，与当前代码中的数据存在差异。

### 差异分析
| 当前代码 | 用户提供 | 差异 |
|---------|---------|------|
| EP2-27400, 16/256/Platinum, ¥9999 | EP2-31819, 16/256 Platinum Metal, ¥8,388 | 编码、价格、配置格式不同 |
| EP2-27410, 16/512/Platinum, ¥11999 | EP2-31849, 16/512 Platinum Metal, ¥9,388 | 编码、价格、配置格式不同 |
| EP2-27420, 24/512/Platinum, ¥12999 | 无对应项 | 用户未提供此配置 |
| EP2-27430, 24/1TB/Platinum, ¥14999 | EP2-31789, 24/1TB Platinum Metal, ¥13,388 | 编码、价格、配置格式不同 |
| 无对应项 | EP2-31758, 16/1T Platinum Metal, ¥11,388 | 用户新增此配置 |

### 更新计划
1. **修改surfaceLaptopSnapdragonCodeMap对象**
   - 更新现有配置的产品编码、价格和配置字符串
   - 添加用户提供的新配置（16/1T Platinum Metal）
   - 移除用户未提供的配置（24/512/Platinum）
   - 保持配置键格式一致，确保验证逻辑正常工作

2. **更新配置字符串格式**
   - 使用用户提供的配置字符串格式：`Snapdragon X Plus | Qualcomm Hexagon (45 TOPS) | 13 英寸 |/16/256CM SC English China Comm Platinum Metal`
   - 确保所有配置的格式一致

3. **验证更新结果**
   - 确保产品编码映射更新后，验证逻辑和添加产品功能正常工作
   - 确保价格计算正确

### 预期结果
- Surface Laptop 13英寸Snapdragon产品的编码映射与用户提供的最新信息完全匹配
- 配置验证和产品添加功能正常工作
- 价格显示正确的ERP价格