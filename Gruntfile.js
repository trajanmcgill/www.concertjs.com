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

				requestAnimationFrameFull:
					{
						src: ["ConcertJS/Components/requestAnimationFrame/requestAnimationFrame.js"],
						dest: "ConcertJS/Build/requestAnimationFrame.full.js"
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

				requestAnimationFrame: { src: ["ConcertJS/Components/requestAnimationFrame/requestAnimationFrame.js"] }
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

				DeUglifyrequestAnimationFrame:
				{
					options: { beautify: true },
					src: ["ConcertJS/Build/requestAnimationFrame.min.js"],
					dest: "ConcertJS/Build/requestAnimationFrame.min.max.js"
				},

				requestAnimationFrame:
				{
					options: { banner: "/*! requestAnimationFrame.js */\n" },

					src: ["ConcertJS/Components/requestAnimationFrame/requestAnimationFrame.js"],
					dest: "ConcertJS/Build/requestAnimationFrame.min.js"
				}
			}
		});
	
	// Load the plugins
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	
	// Default task
	grunt.registerTask("default", ["copy:requestAnimationFrameFull", "copy:ConcertJSFull", "uglify:requestAnimationFrame", "uglify:ConcertJS"]);

	// Other tasks
	grunt.registerTask("minmax", ["uglify:requestAnimationFrame", "uglify:ConcertJS", "uglify:DeUglifyrequestAnimationFrame", "uglify:DeUglifyConcertJS"]);
};
