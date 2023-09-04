const isAuthenticated = (req, res, next)=>{
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/');

};

const isLogout = (req, res, next)=>{
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
};
module.exports ={
    isAuthenticated,
    isLogout
}