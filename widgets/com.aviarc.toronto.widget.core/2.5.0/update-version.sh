#!/bin/bash

die () {
    [ -n "${1}" ] && echo ${1} || cat
    exit ${2:-1}
}

[ ${#*} -ne 2 ] && die << EOF
Usage:
    $(basename "${0}") oldversion newversion
    (oldversion, newversion in format 0.0.0)
EOF

echo $1 | grep -qE '[0-9]+\.[0-9]+\.[0-9]+' || die "Old version '${1}' not in 0.0.0 format" 2
echo $2 | grep -qE '[0-9]+\.[0-9]+\.[0-9]+' || die "New version '${2}' not in 0.0.0 format" 2

oldversion=(${1//./ })
newversion=(${2//./ })

echo -e "Updating widget versions from ${1} to ${2}\n"

file_list () {
    grep -Enr "${oldversion[0]}([_.-])${oldversion[1]}\1${oldversion[2]}" src widgets 2>/dev/null |\
        awk -F: '{print $1}' | sort | uniq
}

cd "$(dirname "${0}")"
echo "Files that will be changed:"
file_list | sed 's,^,    ,'

echo -ne "\nIs this ok? [Yn] "
read response
[ "${response}" == "" -o "${response}" == "y" -o "${response}" == "Y" ] || die "Exiting at user request" 0

file_list |\
    xargs -L1 -d'\n' -- \
        sed -i -s -r "s,${oldversion[0]}([_.-])${oldversion[1]}\1${oldversion[2]},${newversion[0]}\1${newversion[1]}\1${newversion[2]},g"

cat << EOF
Done.
You should use 'git diff' or similar to check the changes were what you expected.
EOF