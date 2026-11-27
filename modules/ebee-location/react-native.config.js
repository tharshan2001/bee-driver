// The Kotlin package stays com.ebee.driver.location (installed apps have scheduled work that names
// these classes), which differs from the library namespace, so autolinking is told where to look.
module.exports = {
  dependency: {
    platforms: {
      android: {
        packageImportPath: 'import com.ebee.driver.location.LocationPackage;',
        packageInstance: 'new LocationPackage()',
      },
    },
  },
};
