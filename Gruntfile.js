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
	}


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

				BaseObject: { options: { strict: false, unused: false }, src: ["ConcertJS/Components/BaseObject/BaseObject.js"] },

				requestAnimationFrame: { src: ["requestAnimationFrame/Source/requestAnimationFrame.js"] },

				ConcertJS: { src: ["ConcertJS/Source/Concert.js"] },

				www: { expand: true, cwd: "www.concertjs.com/Source/", src: ["**/*.js", "!**/*.template.js"] }
			}, // end jshint task definitions


			clean:
			{
				requestAnimationFrame: ["requestAnimationFrame/Build/**/*"],
				ConcertJS: ["ConcertJS/Build/**/*"],
				www: ["www.concertjs.com/Build/**/*"],

				www_Deploy:
				{
					src:
					[
						"www.concertjs.com/Build/Dev/**/*.full.*",
						"www.concertjs.com/Build/Dev/**/*.min.*",
						"!www.concertjs.com/Build/Dev/Reference/**/*",
						"www.concertjs.com/Build/Prod/**/*.full.*",
						"www.concertjs.com/Build/Prod/**/*.min.*",
						"!www.concertjs.com/Build/Dev/Reference/**/*"
					]
				}
			}, // end clean task definitions


			copy:
			{
				requestAnimationFrame_Build: { src: ["requestAnimationFrame/Source/requestAnimationFrame.js"], dest: "requestAnimationFrame/Build/requestAnimationFrame.full.js" },

				ConcertJS_Import: { expand: true, cwd: "requestAnimationFrame/Build/", src: ["*.js"], dest: "ConcertJS/Components/requestAnimationFrame/" },
				ConcertJS_Build:
				{
					files:
					[
						{ src: ["ConcertJS/Source/Concert.js"], dest: "ConcertJS/Build/Concert.full.js" },
						{ expand: true, cwd: "ConcertJS/Components/requestAnimationFrame/", src: ["*.js"], dest: "ConcertJS/Build/" }
					],
				},

				www_Import: { expand: true, cwd: "ConcertJS/Build/", src: ["*.js"], dest: "www.concertjs.com/Components/ConcertJS/" },
				www_Assemble:
				{
					files:
					[
						{ expand: true, cwd: "www.concertjs.com/Components/", src: "**/*", dest: "www.concertjs.com/Build/Assembly/Components/" },
						{ expand: true, cwd: "www.concertjs.com/Source/", src: ["**/*.html", "!**/*.template.html", "!**/*.templateData.html"], dest: "www.concertjs.com/Build/Assembly/" },
						{ expand: true, cwd: "www.concertjs.com/Source/", src: ["**/*.js", "!**/*.template.js", "!**/*.templateData.js"], dest: "www.concertjs.com/Build/Assembly/", ext: ".full.js" },
						{ expand: true, cwd: "www.concertjs.com/Source/", src: ["**/*.css", "!**/*.template.css", "!**/*.templateData.css"], dest: "www.concertjs.com/Build/Assembly/", ext: ".full.css" }
					]
				},
				www_Deploy:
				{
					files:
					[
						{ expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: "**/*", dest: "www.concertjs.com/Build/Dev/" },
						{ expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: "**/*", dest: "www.concertjs.com/Build/Prod/" }
					]
				},
				www_SelectEnvironment:
				{
					files:
					[
						{ expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: "**/*", dest: "www.concertjs.com/Build/Dev/" },
						{ expand: true, cwd: "www.concertjs.com/Build/Dev/", src: "**/*.full.css", dest: "www.concertjs.com/Build/Dev/", rename: stripMinOrFull },
						{ expand: true, cwd: "www.concertjs.com/Build/Dev/", src: "**/*.full.js", dest: "www.concertjs.com/Build/Dev/", rename: stripMinOrFull },

						{ expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: "**/*", dest: "www.concertjs.com/Build/Prod/" },
						{ expand: true, cwd: "www.concertjs.com/Build/Prod/", src: "**/*.min.css", dest: "www.concertjs.com/Build/Prod/", rename: stripMinOrFull },
						{ expand: true, cwd: "www.concertjs.com/Build/Prod/", src: "**/*.min.js", dest: "www.concertjs.com/Build/Prod/", rename: stripMinOrFull }
					]
				},
			}, // end copy task defitions


			processTemplates:
			{
				www: { expand: true, cwd: "www.concertjs.com/Source", src: ["**/*.templateData.html", "**/*.templateData.css", "**/*.templateData.js"], dest: "www.concertjs.com/Build/Assembly/" }
			}, // end processTemplates task definitions


			buildReferenceDocs:
			{
				www:
				{
					sourceFile: "www.concertjs.com/Components/ConcertJS/Concert.full.js",
					destination: "www.concertjs.com/Build/Assembly/Reference",
					template: "www.concertjs.com/DocTemplates/ConcertJS"
				},

				develop:
				{
					sourceFile: "ConcertJS/Source/Concert.js",
					destination: "www.concertjs.com/Build/Dev/Reference",
					template: "www.concertjs.com/DocTemplates/ConcertJS"
				}
			},

			cssmin:
			{
				www: { expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: "**/*.full.css", dest: "www.concertjs.com/Build/Assembly/", ext: ".min.css" }
			}, // end cssmin task definitions


			uglify:
			{
				options: { sequences: false, verbose: true, warnings: true },

				BaseObject: { src: ["ConcertJS/Components/BaseObject/BaseObject.js"], dest: "ConcertJS/Build/BaseObject.min.js" },
				BaseObject_DeUglify: { options: { beautify: true }, src: ["ConcertJS/Build/BaseObject.min.js"], dest: "ConcertJS/Build/BaseObject.min.max.js" },

				requestAnimationFrame: { options: { banner: "/*! requestAnimationFrame.js */\n" }, src: ["requestAnimationFrame/Source/requestAnimationFrame.js"], dest: "requestAnimationFrame/Build/requestAnimationFrame.min.js" },
				requestAnimationFrame_DeUglify: { options: { beautify: true }, src: ["requestAnimationFrame/Build/requestAnimationFrame.min.js"], dest: "requestAnimationFrame/Build/requestAnimationFrame.min.max.js" },

				ConcertJS: { options: { banner: "/*! <%= pkg.name %> <%= pkg.version %> */\n" }, src: ["ConcertJS/Source/Concert.js"], dest: "ConcertJS/Build/Concert.min.js" },
				ConcertJS_DeUglify: { options: { beautify: true }, src: ["ConcertJS/Build/Concert.min.js"], dest: "ConcertJS/Build/Concert.min.max.js" },

				www: { expand: true, cwd: "www.concertjs.com/Build/Assembly/", src: ["**/*.full.js"], dest: "www.concertjs.com/Build/Assembly/", ext: ".min.js" },
				www_DeUglify: { expand: true, options: { beautify: true }, cwd: "www.concertjs.com/Build/Assembly/Scripts/", src: ["*.min.js"], dest: "www.concertjs.com/Build/Assembly/Scripts/", ext: ".min.max.js" }
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
						if (/.*\.js$/i.test(curInputFileName) || /.*\.css$/i.test(curInputFileName))
						{
							openTargetTagStart = "/*<template:targetDef";
							openDataTagStart = "/*<template:data";
							closeDataTag = "/*</template:data>*/";
							tagEnd = ">*/\r\n";
						}
						else if (/.*\.html$/i.test(curInputFileName))
						{
							openTargetTagStart = "<template:targetDef";
							openDataTagStart = "<template:data";
							closeDataTag = "</template:data>";
							tagEnd = ">\r\n";
						}
						else
							grunt.fail.warn("processTemplates: unknown input file type (" + curInputFileName + ").");

						curSourceRootDir = curInputFileName.substr(0, curInputFileName.lastIndexOf("/"))
						fileContents = grunt.file.read(curInputFileName);

						currentPos = 0;
						nextTargetDefPos = fileContents.indexOf(openTargetTagStart, currentPos);
						while (nextTargetDefPos >= 0)
						{
							fullTag = fileContents.substring(nextTargetDefPos, fileContents.indexOf(tagEnd, nextTargetDefPos) + tagEnd.length);
							allTargets[targetExp.exec(fullTag)[1]] = { templateFullName: curSourceRootDir + "/" + templateExp.exec(fullTag)[1], sections: [] };
							currentPos = nextTargetDefPos + fullTag.length;
							nextTargetDefPos = fileContents.indexOf(openTargetTagStart, currentPos)
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
							grunt.log.writeln("newText=:" + newText + ":");

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

	grunt.registerMultiTask(
		"buildReferenceDocs",
		"Run jsdoc to create documentation files",
		function ()
		{
			var sourceFile = this.data.sourceFile, destination = this.data.destination, template = this.data.template;
			grunt.log.write("Running jsdoc\r\n    file:" + sourceFile + "\r\n    template:" + template + "\r\n    output path:" + destination + "\r\n");
			var done = this.async();
			grunt.util.spawn(
				{
					cmd: "jsdoc.bat",
					args: ["--template", template, "--destination", destination, sourceFile],
					opts: { stdio: "pipe" }
				},
				function (error, result, code)
				{
					if (error !== null || (result.stderr && result.stderr !== ""))
					{
						grunt.fail.warn("Error encountered attempting to run jsdoc: " + result.stderr);
						done(false);
					}
					else
						done();
				});
		}); // end call to grunt.registerMultiTask("buildReferenceDocs"...)

	grunt.registerTask("lint_requestAnimationFrame", ["jshint:requestAnimationFrame"]);
	grunt.registerTask("lint_ConcertJS", ["jshint:ConcertJS"]);
	grunt.registerTask("lint_www", ["jshint:www"]);
	grunt.registerTask("lint_all", ["lint_requestAnimationFrame", "lint_ConcertJS", "lint_www"]);

	grunt.registerTask("clean_requestAnimationFrame", ["clean:requestAnimationFrame"]);
	grunt.registerTask("clean_ConcertJS", ["clean:ConcertJS"]);
	grunt.registerTask("clean_www", ["clean:www"]);
	grunt.registerTask("clean_all", ["clean_requestAnimationFrame", "clean_ConcertJS", "clean_www"]);

	grunt.registerTask("build_requestAnimationFrame", ["copy:requestAnimationFrame_Build", "uglify:requestAnimationFrame", "uglify:requestAnimationFrame_DeUglify"]);
	grunt.registerTask("build_ConcertJS", ["copy:ConcertJS_Import", "copy:ConcertJS_Build", "uglify:ConcertJS", "uglify:ConcertJS_DeUglify"]);
	grunt.registerTask("build_www", ["copy:www_Import", "copy:www_Assemble", "processTemplates:www", "cssmin:www", "uglify:www", "uglify:www_DeUglify", "buildReferenceDocs:www", "copy:www_Deploy", "copy:www_SelectEnvironment", "clean:www_Deploy"]);
	grunt.registerTask("build_all", ["build_requestAnimationFrame", "build_ConcertJS", "build_www"]);

	grunt.registerTask("rebuild_all", ["clean_all", "build_all"]);

	grunt.registerTask("default", ["lint_all", "rebuild_all"]);
};
