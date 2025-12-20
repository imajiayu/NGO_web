// 验证物资清单总金额
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../public/content/projects/project-3-supplies-zh.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log('物资清单验证：\n');

let calculatedTotalUAH = 0;
let calculatedTotalUSD = 0;

data.supplies.forEach((item, idx) => {
  const subtotalUAH = item.quantity * item.unitPrice.uah;
  const subtotalUSD = item.quantity * item.unitPrice.usd;
  calculatedTotalUAH += subtotalUAH;
  calculatedTotalUSD += subtotalUSD;

  console.log(`${idx + 1}. ${item.item} × ${item.quantity} = ₴${subtotalUAH.toLocaleString()} ($${subtotalUSD})`);
});

console.log('\n' + '='.repeat(60));
console.log(`计算总额：₴${calculatedTotalUAH.toLocaleString()} ($${calculatedTotalUSD})`);
console.log(`声明总额：₴${data.total.totalCost.uah.toLocaleString()} ($${data.total.totalCost.usd})`);
console.log('='.repeat(60));

if (calculatedTotalUAH === data.total.totalCost.uah && calculatedTotalUSD === data.total.totalCost.usd) {
  console.log('\n✅ 验证通过！金额一致。');
} else {
  console.log('\n❌ 警告：金额不一致！');
  console.log(`差额：₴${calculatedTotalUAH - data.total.totalCost.uah} ($${calculatedTotalUSD - data.total.totalCost.usd})`);
}

console.log(`\n总物品数：${data.supplies.reduce((sum, item) => sum + item.quantity, 0)} (声明: ${data.total.items})`);
console.log(`汇率说明：${data.exchangeRateNote}`);
