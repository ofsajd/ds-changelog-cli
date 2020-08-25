#!/usr/bin/env node

const https = require('https');
const cmp = require('semver-compare');
const colors = require('colors');
const cliSelect = require('cli-select');
const program = require('commander').program;
const exec = require('child_process').exec;

program.version('0.0.1');
program
    .option('-c, --component <component>', 'component name - without `ds` prefix')
    .option('-s, --start-version <startVersion>', 'start version of component', '0.1.0')
    .option('-e, --end-version <endVersion>', 'end version of component')
    .option('-n, --skip-notes', 'skip version bumps');

program.parse(process.argv);
const { component, startVersion, endVersion, skipNotes } = program;

if (!component) {
    exec('npm search @synerise/ds- --searchLimit=100 --json', (error, stdout, strerr) => {
        if (error) {
            console.log(colors.red(error));
        }
        const packages = JSON.parse(stdout).map(package => package.name);
        console.log(packages.length)
        cliSelect({
            values: packages,
            valueRenderer: (value) => value,
        }).then(response => {
            const packageName = response.value.replace('@synerise/ds-', '');
            showChangelog(packageName);
        });
    });
} else {
    showChangelog(component);
}

function showChangelog(package) {
    https.get(`https://raw.githubusercontent.com/Synerise/synerise-design/master/packages/components/${package}/CHANGELOG.md`, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
            const parsedResponse = body.split('\n').filter(row => row !== '').filter(row => row[0] !== '#' || row[0] !== '*');
            const arrayOfVersions = parsedResponse.reduce((result, currentValue, index) => {
                if (currentValue.substr(0, 3) === '## ' || currentValue.substr(0, 2) === '# ') {
                    const version = currentValue.substring(currentValue.indexOf('[') + 1, currentValue.indexOf(']'));
                    result.data[version] = [];
                    result.currentVersion = version;
                }
                if (currentValue.substr(0, 3) === '###') {
                    result.currentType = currentValue.split('### ')[1];
                }
                if (currentValue[0] === '*' || currentValue[0] === '-') {
                    if (currentValue.substr(0, 9) === '**Note:**') {
                        result.data[result.currentVersion].push({
                            type: 'Note',
                            note: currentValue,
                        });
                    } else {
                        result.data[result.currentVersion].push({
                            type: result.currentType,
                            note: currentValue,
                        });
                    }
                }

                return result
            }, {
                data: {},
                currentVersion: '',
                currentType: ''
            });

            showResult(arrayOfVersions.data);
        });
    });
}

const getColor = (type) => {
    const typeColor = {
        Note: 'grey',
        'Bug Fixes': 'red',
        Features: 'green'
    };

    return typeColor[type];
}

const showResult = (versions) => {
    const result = Object.keys(versions).filter(key => {
        return cmp(key, startVersion) >= 0 && (endVersion ? cmp(key, endVersion) <= 0 : true);
    });

    result.forEach(v => {
        if (!(versions[v].length === 1 && versions[v][0].type === 'Note' && skipNotes)) {
            console.log(v.yellow.bold);
            versions[v].forEach(n => {
                console.log(colors[getColor(n.type)](n.note));
            })
        }
    });
};