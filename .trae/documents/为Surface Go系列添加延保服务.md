我将为Surface Go系列产品添加5个延保服务选项，确保它们只在选择Surface Go系列产品时显示。

**计划步骤：**

1. **查看当前延保服务结构**

   * 确认现有延保服务的HTML结构和数据属性

   * 了解filterWarrantiesByProduct函数的工作原理

2. **添加Surface Go系列延保服务**

   * 在HTML中添加5个新的延保服务选项，包含完整的UI元素和数据属性

   * 设置正确的兼容类别（surface-go），确保这些延保服务只在选择Surface Go系列产品时显示

   * 保留与现有延保服务相同的UI风格和交互逻辑

3. **验证实现**

   * 运行GetDiagnostics工具检查代码是否有语法错误或警告

   * 确保新添加的延保服务只在选择Surface Go系列产品时显示

**添加的延保服务：**

1. **商用级硬件延保（3年硬件保修）** - ¥258

   * 产品编码：9C2-00439

   * 配置：Microsoft® Comm EHS 1YR on 2YR Mfg Wty SC Warranty ehs China 1 License CNY 0

2. **商用级硬件延保（4年硬件保修）** - ¥558

   * 产品编码：VP4-00463

   * 配置：Microsoft® Comm EHS 2YR on 2YR Mfg Wty SC Warranty ehs China 1 License CNY 0

3. **商用级2年意外保修** - ¥588

   * 产品编码：GJX-00017

   * 配置：Microsoft® Complete for Business 2Y ADP SC Warranty China 1 License EHS ADP CNY Surface Go

4. **商用级意外保修（3年含意外保障）** - ¥1,058

   * 产品编码：9C3-00452

   * 配置：Microsoft® Complete for Bus 1YR on 2YR Mfg Wty SC Warranty China 1 License EHS ADP CNY Surface Go

5. **商用级意外保修（4年含意外保障）** - ¥1,528

   * 产品编码：HN9-00422

   * 配置：Microsoft® COMPLETE FOR BUS 2 YR ON 2YR MFG WT SC Warranty China 1 License EHS ADP CNY Surface Go

**实现方式：**

* 在HTML的warranties-container中添加这5个新的延保服务选项

* 设置data-compatible-with="surface-go"属性，确保它们只在选择Surface Go系列产品时显示

* 保持与现有延保服务相同的UI结构和交互逻辑

