const axios = require('axios');
require('dotenv').config();

async function calculateProjections(stocks) {
    const linearProjections = await getProjections(stocks, simpleLinearEstimate);
    const linearRegressions = await getProjections(stocks, LinearRegressionEstimate);
    return { linearProjections, linearRegressions };
}

async function getProjections(stocks, estimationFunction) {
    const projections = [];

    for (const stock of stocks) {
        const historicalPrices = await getHistoricalPrices(stock.symbol);
        let projection;

        if (historicalPrices.length < 2) {
            projection = {
                symbol: stock.symbol,
                currentPrice: stock.individualPrice,
                nextMonthPrice: stock.currentPrice,
                purchased: stock.purchased,
                priceChange: 0,
                totalGain: 0,
                warning: `Datos insuficientes (${historicalPrices.length} puntos)`
            };
        } else {
            const { nextMonthPrice } = estimationFunction(historicalPrices);

            const priceChange = nextMonthPrice - stock.individualPrice;
            const totalGain = priceChange * stock.purchased;

            projection = {
                symbol: stock.symbol,
                currentPrice: stock.individualPrice,
                nextMonthPrice,
                purchased: stock.purchased,
                priceChange,
                totalGain
            };
        }

        projections.push(projection);
    }

    return projections;
}

//Documentarr
// calculo proyeccion lineal 

function LinearRegressionEstimate(prices) {
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

function simpleLinearEstimate(prices) {
  // Validación básica
  if (!Array.isArray(prices) || prices.length < 2) {
    throw new Error('Se requieren al menos 2 puntos de datos');
  }

  const firstPoint = prices[0];
  const lastPoint = prices[prices.length - 1];

  // Convertir timestamps a días
  const firstDate = new Date(firstPoint.timestamp);
  const lastDate = new Date(lastPoint.timestamp);
  const totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

  // Calcular pendiente (m)
  const m = (lastPoint.price - firstPoint.price) / totalDays;
  const b = lastPoint.price
  // Calcular precio proyectado (30 días después del último punto)
  const nextMonthPrice = lastPoint.price + m * 30;

  return { m, b, nextMonthPrice };
}

async function getHistoricalPrices(symbol) {
    try {
        const response = await axios.get(`${process.env.URL_API}/stocktrajectory/${symbol}`);
        
        if (!response.data || !Array.isArray(response.data)) {
            throw new Error('Formato de respuesta inválido');
        }

        return response.data.map(item => ({
            price: item.price,
            timestamp: item.timestamp
        }));

    } catch (error) {
        console.error(`Error obteniendo precios para ${symbol}:`, error.message);
        return [];
    }
}

module.exports = { calculateProjections };