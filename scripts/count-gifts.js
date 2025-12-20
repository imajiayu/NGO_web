// 统计礼物数量
const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../public/content/projects/project-3-zh.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const giftCounts = {};

data.giftsList.forEach(shelter => {
  shelter.children.forEach(child => {
    const gift = child.gift;
    giftCounts[gift] = (giftCounts[gift] || 0) + 1;
  });
});

console.log('礼物统计：');
console.log('总计儿童数：', data.giftsList.reduce((sum, s) => sum + s.children.length, 0));
console.log('\n各类礼物数量：');
Object.entries(giftCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([gift, count]) => {
    console.log(`${gift}: ${count}`);
  });

console.log('\n总花费：', data.statistics.totalCost.uah, 'UAH =', data.statistics.totalCost.usd, 'USD');
console.log('平均每人：', data.statistics.averagePerChild, 'USD');
console.log('汇率：', (data.statistics.totalCost.uah / data.statistics.totalCost.usd).toFixed(2), 'UAH/USD');
