module.exports = function(grunt)
{
	// Project configuration.
	grunt.initConfig(
		{
			pkg: grunt.file.readJSON("package.json"),


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

				ConcertJSMin: { src: ["Build/Concert.min.js"] },

				ConcertJSMinMax: { src: ["Build/Concert.min.max.js"] }
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
					dest: "Build/BaseObject.min.js"
				},
			
				ConcertJS:
				{
					options: { banner: "/*! <%= pkg.name %> <%= pkg.version %> */\n" },
					
					src: ["ConcertJS/Source/Concert.js"],
					dest: "Build/Concert.min.js"
				},

				DeUglifyBaseObject:
				{
					options: { beautify: true },
					src: ["Build/Concert.min.js"],
					dest: "Build/Concert.min.max.js"
				},

				DeUglifyConcertJS:
				{
					options: { beautify: true },
					src: ["Build/BaseObject.min.js"],
					dest: "Build/BaseObject.min.max.js"
				}
			}
		});
	
	// Load the plugins
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	
	// Default task
	grunt.registerTask("default", ["uglify:ConcertJS"]);

	// Other tasks
	grunt.registerTask("minmax", ["uglify:ConcertJS", "uglify:DeUglifyConcertJS"]);
};
