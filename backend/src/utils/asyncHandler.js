const asyncHandler = (requestHandlerFn) => {
    return (req, res, next) => {
        Promise.resolve(requestHandlerFn(req, res, next)).catch((error) => next(error))
    }
}

export default asyncHandler;