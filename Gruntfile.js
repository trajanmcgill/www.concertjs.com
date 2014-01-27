module.exports = function(grunt)
{
	function stripMinOrFull(dest, src)
	{
		var fullOriginalDest = dest + src,
			testExp = /(.*)(\.min|\.full)(\..+)/,
			testResult = testExp.exec(fullOriginalDest),
			outputFile = (testResult === null) ? fullOriginalDest : (testResult[1] + testResult[3]);

		console.log("copying " + fullOriginalDest + " to " + outputFile);

		return outputFile;
	} // end stripMinOrFull()


	// Project configuration.
	grunt.initConfig(
		{
			pkg: grunt.file.readJSON("package.json"),


			jshint:
			{
				options:
				{
					bitwise: true, browser: true, curly: false, eqeqeq: true, forin: true, immed: true, latedef: true, laxbreak: true, laxcomma: true, newcap: true,
					noarg: true, noempty: true, nonew: true, quotmark: "double", smarttabs: true, strict: true, trailing: true, undef: true, unused: true, validthis: true
				},

				checkSource: { expand: true, cwd: "www.concertjs.com/Source/", src: ["**/*.js", "!**/*.template.js"] }
			}, // end jshint task definitions


			clean:
			{
				www: ["www.concertjs.com/Build/**/*"],

				removeAssembledOriginalJSandCSS:
				{
					src:
					[
						"www.concertjs.com/Build/Assembly/**/*.js",
						"www.concertjs.com/Build/Assembly/**/*.css",
						"!**/*.full.js",
						"!**/*.full.css"
					]
				},

				removeFullAndMinFiles:
				{
					src:
					[
						"www.concertjs.com/Build/Dev/**/*.full.*",
						"www.concertjs.com/Build/Dev/**/*.min.*",
						"www.concertjs.com/Build/Prod/**/*.full.*",
						"www.concertjs.com/Build/Prod/**/*.min.*"
					]
				}
			}, // end clean task definitions


			copy:
			{
				assembleNonTemplatedSourceFiles:
				{
					files:
					[
						{ expand: true, cwd: "www.concertjs.com/Source/", src: ["**/*.html", "!Tutorial/**/*", "!**/*.template.html", "!**/*.templateData.html"], dest: "www.concertjs.com/Build/Assembly/" },
						{ expand: true, cwd: "www.concertjs.com/Source/", src: ["**/*.js", "!Tutorial/**/*", "!**/*.template.js", "!**/*.templateData.js"], dest: "www.concertjs.com/Build/Assembly/" },
						{ expand: true, cwd: "www.concertjs.com/Source/", src: ["**/*.css", "!Tutorial/**/*", "!**/*.template.css", "!**/*.templateData.css"], dest: "www.concertjs.com/Build/Assembly/" }
					]
				},

				copyOriginalToFull:
				{
					files:
					[
						{ expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: ["**/*.js"], dest: "www.concertjs.com/Build/Assembly/", ext: ".full.js" },
						{ expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: ["**/*.css"], dest: "www.concertjs.com/Build/Assembly/", ext: ".full.css" },
					]
				},

				deployAssembledFiles:
				{
					files:
					[
						{ expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: "**/*", dest: "www.concertjs.com/Build/Dev/" },
						{ expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: "**/*", dest: "www.concertjs.com/Build/Prod/" }
					]
				},

				deployComponents:
				{
					files:
					[
						{ expand: true, cwd: "www.concertjs.com/Components/", src: "**/*", dest: "www.concertjs.com/Build/Dev/Components/" },
						{ expand: true, cwd: "www.concertjs.com/Components/", src: "**/*", dest: "www.concertjs.com/Build/Prod/Components/" }
					]
				},

				deployTutorial:
				{
					files:
					[
						{ expand: true, cwd: "www.concertjs.com/Source/Tutorial/", src: "**/*", dest: "www.concertjs.com/Build/Dev/Tutorial/" },
						{ expand: true, cwd: "www.concertjs.com/Source/Tutorial/", src: "**/*", dest: "www.concertjs.com/Build/Prod/Tutorial/" }
					]
				},

				selectEnvironment:
				{
					files:
					[
						{ expand: true, cwd: "www.concertjs.com/Build/Dev/", src: "**/*.full.css", dest: "www.concertjs.com/Build/Dev/", rename: stripMinOrFull },
						{ expand: true, cwd: "www.concertjs.com/Build/Dev/", src: "**/*.full.js", dest: "www.concertjs.com/Build/Dev/", rename: stripMinOrFull },

						{ expand: true, cwd: "www.concertjs.com/Build/Prod/", src: "**/*.min.css", dest: "www.concertjs.com/Build/Prod/", rename: stripMinOrFull },
						{ expand: true, cwd: "www.concertjs.com/Build/Prod/", src: "**/*.min.js", dest: "www.concertjs.com/Build/Prod/", rename: stripMinOrFull }
					]
				}
			}, // end copy task defitions


			processTemplates:
			{
				assembleTemplateResults: { expand: true, cwd: "www.concertjs.com/Source", src: ["**/*.templateData.html", "**/*.templateData.css", "**/*.templateData.js"], dest: "www.concertjs.com/Build/Assembly/" }
			}, // end processTemplates task definitions


			cssmin:
			{
				minifyAssembledCSS: { expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: "**/*.full.css", dest: "www.concertjs.com/Build/Assembly/", ext: ".min.css" }
			}, // end cssmin task definitions


			uglify:
			{
				options: { sequences: false, verbose: true, warnings: true },

				minifyAssembledJS: { expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: ["**/*.full.js"], dest: "www.concertjs.com/Build/Assembly/", ext: ".min.js" },
				deminifyAssembledJS: { expand: true, options: { beautify: true }, cwd: "www.concertjs.com/Build/Assembly/", src: ["*.min.js"], dest: "www.concertjs.com/Build/Assembly/", ext: ".min.max.js" }
			} // end uglify task definitions
		});
	
	
	// Load the plugins
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-cssmin");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	
	// Define tasks
	grunt.registerMultiTask(
		"processTemplates",
		"Build output from templates",
		function ()
		{
			this.files.forEach(
				function (file)
				{
					var i, j, curInputFileName, fileContents, outputBuffers = [], currentPos, nextOpenTagPos, nextCloseTagPos,
						curTargetFullName, templateContents, templateVarExp = /{{([^ \t\s\r\n]+?)}}/g, varMatch, targetOutput,
						openElementStack = [], allTargets = {}, fullTag, newElement, newText, nextTargetDefPos, finishedElement,
						curDestRootDir = file.dest.substr(0, file.dest.lastIndexOf("/")), curTarget, curSection, curSourceRootDir,
						templateExp = /\s+template="([^"]*)"/, sectionExp = /\s+section="([^"]*)"/, targetExp = /\s+target="([^"]*)"/,
						openTargetTagStart, openDataTagStart, closeDataTag, tagEnd;

					for (i = 0; i < file.src.length; i++)
					{
						curInputFileName = file.src[i];
						//grunt.log.writeln("Examining file: " + curInputFileName);
						if (/.*\.js$/i.test(curInputFileName) || /.*\.css$/i.test(curInputFileName))
						{
							//grunt.log.writeln("  js or css.");
							openTargetTagStart = "/*<template:targetDef";
							openDataTagStart = "/*<template:data";
							closeDataTag = "/*</template:data>*/";
							tagEnd = ">*/\r\n";
						}
						else if (/.*\.html$/i.test(curInputFileName))
						{
							//grunt.log.writeln("  html.");
							openTargetTagStart = "<template:targetDef";
							openDataTagStart = "<template:data";
							closeDataTag = "</template:data>";
							tagEnd = ">\r\n";
						}
						else
							grunt.fail.warn("processTemplates: unknown input file type (" + curInputFileName + ").");

						curSourceRootDir = curInputFileName.substr(0, curInputFileName.lastIndexOf("/"))
						//grunt.log.writeln("  curSourceRootDir=" + curSourceRootDir);
						fileContents = grunt.file.read(curInputFileName);
						//grunt.log.writeln("  File has been read.");
						//grunt.log.writeln("  File contents:" + fileContents)

						currentPos = 0;
						nextTargetDefPos = fileContents.indexOf(openTargetTagStart, currentPos);
						//grunt.log.writeln("  openTargetTagStart=" + openTargetTagStart + "; nextTargetDefPos=" + nextTargetDefPos);
						while (nextTargetDefPos >= 0)
						{
							fullTag = fileContents.substring(nextTargetDefPos, fileContents.indexOf(tagEnd, nextTargetDefPos) + tagEnd.length);
							allTargets[targetExp.exec(fullTag)[1]] = { templateFullName: curSourceRootDir + "/" + templateExp.exec(fullTag)[1], sections: [] };
							currentPos = nextTargetDefPos + fullTag.length;
							nextTargetDefPos = fileContents.indexOf(openTargetTagStart, currentPos)
							//grunt.log.writeln("  nextTargetDefPos=" + nextTargetDefPos);
						}

						currentPos = 0;
						nextOpenTagPos = fileContents.indexOf(openDataTagStart, currentPos);
						nextCloseTagPos = fileContents.indexOf(closeDataTag, currentPos);
						while (nextOpenTagPos >= 0 || nextCloseTagPos >= 0)
						{
							if (nextOpenTagPos < nextCloseTagPos && nextOpenTagPos >= 0)
								newText = fileContents.substring(currentPos, nextOpenTagPos);
							else
								newText = fileContents.substring(currentPos, nextCloseTagPos);
							for (j = 0; j < openElementStack.length; j++)
								openElementStack[j].output += newText;

							if (nextOpenTagPos < nextCloseTagPos && nextOpenTagPos >= 0)
							{
								fullTag = fileContents.substring(nextOpenTagPos, fileContents.indexOf(tagEnd, nextOpenTagPos) + tagEnd.length);
								currentPos = nextOpenTagPos + fullTag.length;

								newElement = { target: targetExp.exec(fullTag)[1], section: sectionExp.exec(fullTag)[1], output: "" };
								openElementStack.push(newElement);
							}
							else
							{
								fullTag = fileContents.substring(nextCloseTagPos, fileContents.indexOf(tagEnd, nextCloseTagPos) + tagEnd.length);
								currentPos = nextCloseTagPos + fullTag.length;

								finishedElement = openElementStack.pop();
								allTargets[finishedElement.target].sections[finishedElement.section] = finishedElement.output;
							}
							nextOpenTagPos = fileContents.indexOf(openDataTagStart, currentPos);
							nextCloseTagPos = fileContents.indexOf(closeDataTag, currentPos);
						} // end while (nextOpenTagPos >= 0 || nextCloseTagPos >= 0)

						grunt.log.writeln("");
					} // end for (i = 0; i < file.src.length; i++)

					for (curTarget in allTargets) if (allTargets.hasOwnProperty(curTarget))
					{
						curTargetFullName = curDestRootDir + "/" + curTarget;
						//grunt.log.writeln("curTargetFullName=" + curTargetFullName);

						templateContents = grunt.file.read(allTargets[curTarget].templateFullName);
						targetOutput =
							templateContents.replace(
								templateVarExp,
								function (match, p1)
								{
									if (typeof allTargets[curTarget].sections[p1] !== "string")
										grunt.fail.warn("No match found for template variable: " + p1);
									return allTargets[curTarget].sections[p1];
								});

						grunt.log.writeln("Writing target file: " + curTargetFullName);
						grunt.file.write(curTargetFullName, targetOutput);
					}
				});
		}); // end call to grunt.registerMultiTask("processTemplates"...)

	grunt.registerTask("lint_all", ["jshint:checkSource"]);

	grunt.registerTask("clean_all", ["clean:www"]);

	grunt.registerTask(
		"build_www",
		[
			"copy:assembleNonTemplatedSourceFiles", // copy non-templated source files into assembly directory, excluding tutorial files
			"processTemplates:assembleTemplateResults", // process templates into assembly directory
			"copy:copyOriginalToFull", // copy all .js and .css files in assembly directory to *.full.js and *.full.css
			"clean:removeAssembledOriginalJSandCSS", // remove all original .js and css files from assembly directory
			"uglify:minifyAssembledJS", // minify all .full.js files in assembly directory into .min.js
			"cssmin:minifyAssembledCSS", // minify all .full.css files in assembly directory into .min.css
			"copy:deployAssembledFiles", // copy all assembly files into dev and prod directories
			"copy:selectEnvironment",  // copy, in prod directory, *.min.js to *.js and *.min.css to *.css, and in dev directory, *.full.js to *.js and *.full.css to *.css
			"clean:removeFullAndMinFiles", // clean all .min.css, .min.js, .full.css, and .full.js files from dev and prod directories
			"copy:deployComponents", // copy components directory into dev and prod directories
			"copy:deployTutorial" // copy tutorials directory into dev and prod directories
		]);
	grunt.registerTask("build_all", ["build_www"]);

	grunt.registerTask("rebuild_all", ["clean_all", "build_all"]);

	grunt.registerTask("default", ["lint_all", "rebuild_all"]);
};

/*
-clean build directories
-copy non-templated source files into assembly directory, excluding tutorial files
-process templates into assembly directory
-copy all .css files in assembly directory to *.full.css and all .js files in assembly directory to *.full.js
-remove all original .js and css files from assembly directory
-minify all .full.js files in assembly directory into .min.js
-minify all .full.css files in assembly directory into .min.css
-copy all assembly files into dev and prod directories
-copy, in prod directory, *.min.js to *.js and *.min.css to *.css, and in dev directory, *.full.js to *.js and *.full.css to *.css
-clean all .min.css, .min.js, .full.css, and .full.js files from dev and prod directories
-copy components directory into dev and prod directories
-copy tutorials directory into dev and prod directories
*/