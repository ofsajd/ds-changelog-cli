## Example usage: 

```$ node index.js -c table -s 0.2.0 -e 0.5.0 -n```

## Options:

+  -V, --version                       output the version number
+  -c, --component <component>         component name - without `ds` prefix
+  -s, --start-version <startVersion>  start version of component (default: "0.1.0")
+  -e, --end-version <endVersion>      end version of component
+  -n, --skip-notes                    skip version bumps
+  -h, --help                          display help for command