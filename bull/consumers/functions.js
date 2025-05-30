const axios = require('axios');
require('dotenv').config();
// calcular proyecciones 
async function calculateProjections(stocks) {
    const projections = [];

    for (const stock of stocks) {
        // Obtener precios históricos (último mes)
        const historicalPrices = await getHistoricalPrices(stock.symbol);
        let projection;

        if (historicalPrices.length < 2) {
            projection = {
                symbol: stock.symbol,
                currentPrice: stock.currentPrice,
                nextMonthPrice: stock.currentPrice, // Mantiene el precio actual
                purchased: stock.purchased,
                priceChange: 0, // Sin cambio
                totalGain: 0, // Sin ganancia
                warning: `Datos insuficientes (${historicalPrices.length} puntos)`
            };
        } else {
            const { nextMonthPrice } = calculateLinearProjection(historicalPrices);

            const priceChange = nextMonthPrice - stock.currentPrice;
            const totalGain = priceChange * stock.purchased;

            projection = {
                symbol: stock.symbol,
                currentPrice: stock.currentPrice,
                nextMonthPrice,
                purchased: stock.purchased,
                priceChange,
                totalGain: totalGain
            };
        }

        projections.push(projection);
    }

    return projections;
}

// calculo proyeccion lineal 

function calculateLinearProjection(prices) {
    // Convertir fechas a timestamps (días desde el primer dato)
    const timestamps = prices.map(p => new Date(p.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const xValues = timestamps.map(t => (t - minTime) / (1000 * 60 * 60 * 24)); // Días

    // Calcular pendiente (m) y coeficiente (b) para y = m*x + b
    const n = prices.length;
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = prices.reduce((a, b) => a + b.price, 0);
    const sumXY = prices.reduce((a, b, i) => a + (b.price * xValues[i]), 0);
    const sumXX = xValues.reduce((a, b) => a + (b * b), 0);

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX); // Pendiente
    const b = (sumY - m * sumX) / n; // Intersección

    // Predecir precio en 30 días (próximo mes)
    const nextMonthX = xValues[xValues.length - 1] + 30;
    const nextMonthPrice = m * nextMonthX + b;

    return { m, b, nextMonthPrice };
}

// obtener precios historicos 

async function getHistoricalPrices(symbol) {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const prices = await axios.get(`${process.env.URL_API}/stocktrajectory/:${symbol}`);

    return prices;
}

module.exports = { calculateProjections };