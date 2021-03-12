const axios = require('axios');


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

let rlsCount = 10000000;
let coinCount = 1;
let type = 'rls';
const technicalProfit = 0.25;
const technicalLoss = -0.15;
const profit = 1.03;
const loss = 0.98;
const coinName = 'eth';
let lossCount = 0;
const maxLossCount = 3;
const sleepAfterMaxLossCount = 2*60*60*1000;

const config = {
    method: 'post',
    url: 'https://api.nobitex.ir/market/stats',
    headers: {
        'Content-Type': 'application/json',
        'Cookie': '__cfduid=d475d23a83a822a2420cad80e066a1d771615141411'
    },
    data: {
        'srcCurrency': coinName,
        'dstCurrency': 'rls'
    }
};

const tradingViewConfig = {
    method: 'POST',
    url: 'https://scanner.tradingview.com/crypto/scan',
    data: {
        symbols: {
            tickers: [
                `BINANCE:${coinName.toUpperCase()}USDT`
            ],
            query: {
                types: []
            }
        },
        columns: [
            "Recommend.All|5",
            "Recommend.Other|5",
            "Recommend.MA|5",
        ]
    }
}


async function start() {
    while (true) {
        try {
            const tradingViewRes = await axios(tradingViewConfig);
            // console.log(tradingViewRes.data.data[0]);
            if (type === 'rls' && tradingViewRes.data.data[0].d[0] > technicalProfit) {
                console.log(tradingViewRes.data.data[0]);
                const nobitexRes = await axios(config);
                const bestSell = nobitexRes.data.stats[`${coinName}-rls`].bestSell;
                coinCount = rlsCount / bestSell;
                type = 'doge';
                console.log('buy', new Date().toLocaleString('fa'), 'rls', rlsCount, 'bestSell', bestSell, 'count', coinCount);
            } else if (type !== 'rls' && tradingViewRes.data.data[0].d[0] < technicalLoss) {
                console.log(tradingViewRes.data.data[0]);
                const nobitexRes = await axios(config);
                const bestBuy = nobitexRes.data.stats[`${coinName}-rls`].bestBuy;
                if (coinCount * bestBuy > rlsCount * profit) {
                    rlsCount = coinCount * bestBuy;
                    type = 'rls';
                    lossCount = 0;
                    console.log('sell by profit', new Date().toLocaleString('fa'), 'result', rlsCount, 'bestBuy', bestBuy);
                } else if (coinCount * bestBuy < rlsCount * loss){
                    rlsCount = coinCount * bestBuy;
                    type = 'rls';
                    lossCount++;
                    console.log('sell by loss', new Date().toLocaleString('fa'), 'result', rlsCount, 'bestBuy', bestBuy);
                    if(lossCount >= maxLossCount) {
                        await sleep(sleepAfterMaxLossCount);
                    }
                } else {
                    console.log('must sell but not enough profit', new Date().toLocaleString('fa'), 'before', rlsCount, 'bestBuy', bestBuy, 'result', coinCount * bestBuy);
                }
            }
        } catch (e) {
            console.log('connection error')
        }
        await sleep(60000);
    }
}

start();
