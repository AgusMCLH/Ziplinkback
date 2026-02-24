const validateEmailNPass = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const message = err.errors?.[0]?.message || 'Invalid input';
    res.status(400).send({ status: 'error', message });
  }
};

export default validateEmailNPass;
