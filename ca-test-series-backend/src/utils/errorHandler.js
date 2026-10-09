function notFound(req,res,next){
  res.status(404).json({ message: 'Not Found' });
}

function errorHandler(err,req,res,next){
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
}

module.exports = { notFound, errorHandler };
