echo "Copying Files..."
rm -r ../axios-utilities-node-ts/compiled/
cp ./AxiosWebClient ../axios-utilities-node-ts/
cp ./index.ts ../axios-utilities-node-ts/
cp ./log.md ../axios-utilities-node-ts/
cp ./readme.md ../axios-utilities-node-ts/
cp ./log.md ../axios-utilities-node-ts/
echo "Building..."
cd ../axios-utilities-node-ts/
./build
cd -
echo "Done. Please make a git commit in that folder, now."