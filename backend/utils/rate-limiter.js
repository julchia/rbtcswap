const RateLimiter = require('limiter').RateLimiter;
const limiter = new RateLimiter(15, 'second', true);

module.exports = {
  /**
   * Limita la cantidad de requests en un período de tiempo
   * @return {function} Si no hay más tokens error, caso contrario ejecuta próxima instrucción
   */
  rateLimiter  (req, res, next) {
    limiter.removeTokens(1, (err, remainingRequests) => {
      if (remainingRequests < 0) {
        res.writeHead(429, { 'Content-Type': 'text/plain;charset=UTF-8' });

        return res.end('Too Many Requests - your IP is being rate limited');
      }

      return next();
    });
  }
};