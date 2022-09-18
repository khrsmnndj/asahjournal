const jwt = require('jsonwebtoken');
const { JWT_KEY } = require('../config/config');

const verifyToken = (req, res, next) => {
	// the token will requested from headers cookies that contain token
	const token = req.cookies.token;
	if(token ==  null ) return res.status(401).send('you are not allowed');

	// if the token verified then this middlewares will call the next middlewares if exist
	const verified = jwt.verify(token, JWT_KEY);
	if (verified) { 
		next()
	} else {
		return res.status(401).send('you are not allowed.');
	}
}

module.exports = { verifyToken }