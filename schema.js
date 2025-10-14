const joi = require("joi");

module.exports.listingSchema = joi.object({
    listing: joi.object({
        title: joi.string().required().min(5).max(100)
            .messages({
                'string.empty': 'Title cannot be empty',
                'string.min': 'Title must be at least 5 characters long',
                'string.max': 'Title cannot be longer than 100 characters',
                'any.required': 'Title is required'
            }),
        description: joi.string().required().max(1000)
            .messages({
                'string.empty': 'Description cannot be empty',
                'string.max': 'Description cannot be longer than 1000 characters',
                'any.required': 'Description is required'
            }),
        location: joi.string().required().min(3).max(100)
            .messages({
                'string.empty': 'Location cannot be empty',
                'string.min': 'Location must be at least 3 characters long',
                'string.max': 'Location cannot be longer than 100 characters',
                'any.required': 'Location is required'
            }),
        country: joi.string().required().min(3).max(50)
            .messages({
                'string.empty': 'Country cannot be empty',
                'string.min': 'Country must be at least 3 characters long',
                'string.max': 'Country cannot be longer than 50 characters',
                'any.required': 'Country is required'
            }),
        price: joi.number().required().min(0).max(1000000)
            .messages({
                'number.base': 'Price must be a number',
                'number.empty': 'Price cannot be empty',
                'number.min': 'Price cannot be negative',
                'number.max': 'Price cannot exceed 1,000,000',
                'any.required': 'Price is required'
            }),
        image: joi.string().allow("", null)
            .messages({
                'string.uri': 'Image URL must be a valid image URL (jpg, jpeg, png, gif, or webp)',
            }),
    }).required(),
});

module.exports.reviewSchema = joi.object({
    review:joi.object({
        rating:joi.number().required().min(1).max(5),
        comment:joi.string().required(),
    })
}).required();