# FS-EventBridge-JS Change Log
This project adheres to [Semantic Versioning](http://semver.org/).

## [Development]
Nothing yet!

## [v0.2.0]
### Added
- `ignoreMs` option to prevent infinite loops in NFS-share use cases, and reduce load of rapidly-changing files
- `ignoreHidden` option to ignore changes in hidden files and folders

### Changed
- `client.start()` will now properly reject if the connection fails.

## v0.1.0
### Added
- Initial release

[Development]: https://github.com/TomFrost/Squiss/compare/v0.2.0...HEAD
[v0.2.0]: https://github.com/TomFrost/Squiss/compare/v0.1.0...v0.2.0
