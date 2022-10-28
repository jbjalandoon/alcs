exports.getDashboard = (req,res,next) => {
 return res.render('admin/dashboard', {
  title: 'ALCS | Dashboard',
 })
}