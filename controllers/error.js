exports.get404 = (req, res, next) => {
    res.render('error/404', {
        title: 'ALCS | 404 Page Not Found'
    })
}