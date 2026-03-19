const validateEmailNPass = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);

    next();
  } catch (err) {
    const error = JSON.parse(err);
    console.log(error);

    const message = error?.[0]?.message || 'Invalid input';
    res.status(400).json({ status: 'error', message });
  }
};

export default validateEmailNPass;
