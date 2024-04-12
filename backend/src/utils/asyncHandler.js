export const asyncHandler = (requestHandlerFn) => {
    (req, res, next) => {
        Promise.resolve(requestHandlerFn(req, res, next)).catch((error) => next(error))
    }
}