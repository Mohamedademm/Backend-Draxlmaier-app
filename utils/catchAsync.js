/**
 * Catch Async Errors Wrapper
 * Wraps async route handlers to catch errors and pass them to next()
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
