class CryptoMarketScanner {
    async coins(peggedCurrency = 'usd', mapFn) {
        const url = 'https://api.coingecko.com/api/v3/coins/markets';
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'x-cg-demo-api-key': process.env.COINGECKO_API_KEY
            }
        };
        const queries = new URLSearchParams({
            'vs_currency': peggedCurrency,
            'order': 'market_cap_desc',
            'per_page': 5
        })

        let res = await fetch(url + '?' + queries, options)
        let list = await res.json()
        return list.map(mapFn);
    }

}

module.exports = CryptoMarketScanner