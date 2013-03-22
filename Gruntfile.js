module.exports = function(grunt)
{
	// Project configuration.
	grunt.initConfig(
		{
			pkg: grunt.file.readJSON("package.json"),


			copy:
			{
				ConcertJSFull:
					{
						src: ["ConcertJS/Source/Concert.js"],
						dest: "ConcertJS/Build/Concert.full.js"
					},

				RequestAnimationFrameFull:
					{
						src: ["ConcertJS/Components/RequestAnimationFrame/RequestAnimationFrame.js"],
						dest: "ConcertJS/Build/RequestAnimationFrame.full.js"
					}
			},


			jshint:
			{
				options:
				{
					bitwise: true,
					browser: true,
					curly: false,
					eqeqeq: true,
					forin: true,
					immed: true,
					latedef: true,
					laxbreak: true,
					laxcomma: true,
					newcap: true,
					noarg: true,
					noempty: true,
					nonew: true,
					quotmark: "double",
					smarttabs: true,
					strict: true,
					trailing: true,
					undef: true,
					unused: true,
					validthis: true
				},


				BaseObject:
				{
					options: { strict: false, unused: false },
					src: ["ConcertJS/Components/BaseObject/BaseObject.js"]
				},

				ConcertJS: { src: ["ConcertJS/Source/Concert.js"] },

				ConcertJSMin: { src: ["ConcertJS/Build/Concert.min.js"] },

				ConcertJSMinMax: { src: ["ConcertJS/Build/Concert.min.max.js"] },

				RequestAnimationFrame: { src: ["ConcertJS/Components/RequestAnimationFrame/RequestAnimationFrame.js"] }
			},


			uglify:
			{
				options:
				{
					sequences: false,
					verbose: true,
					warnings: true
				},


				BaseObject:
				{
					src: ["ConcertJS/Components/BaseObject/BaseObject.js"],
					dest: "ConcertJS/Build/BaseObject.min.js"
				},
			
				ConcertJS:
				{
					options: { banner: "/*! <%= pkg.name %> <%= pkg.version %> */\n" },
					
					src: ["ConcertJS/Source/Concert.js"],
					dest: "ConcertJS/Build/Concert.min.js"
				},

				DeUglifyBaseObject:
				{
					options: { beautify: true },
					src: ["ConcertJS/Build/BaseObject.min.js"],
					dest: "ConcertJS/Build/BaseObject.min.max.js"
				},

				DeUglifyConcertJS:
				{
					options: { beautify: true },
					src: ["ConcertJS/Build/Concert.min.js"],
					dest: "ConcertJS/Build/Concert.min.max.js"
				},

				DeUglifyRequestAnimationFrame:
				{
					options: { beautify: true },
					src: ["ConcertJS/Build/RequestAnimationFrame.min.js"],
					dest: "ConcertJS/Build/RequestAnimationFrame.min.max.js"
				},

				RequestAnimationFrame:
				{
					options: { banner: "/*! RequestAnimationFrame.js */\n" },

					src: ["ConcertJS/Components/RequestAnimationFrame/RequestAnimationFrame.js"],
					dest: "ConcertJS/Build/RequestAnimationFrame.min.js"
				}
			}
		});
	
	// Load the plugins
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	
	// Default task
	grunt.registerTask("default", ["copy:RequestAnimationFrameFull", "copy:ConcertJSFull", "uglify:RequestAnimationFrame", "uglify:ConcertJS"]);

	// Other tasks
	grunt.registerTask("minmax", ["uglify:RequestAnimationFrame", "uglify:ConcertJS", "uglify:DeUglifyRequestAnimationFrame", "uglify:DeUglifyConcertJS"]);
};
