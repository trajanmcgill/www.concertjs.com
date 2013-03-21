module.exports = function(grunt)
{
	// Project configuration.
	grunt.initConfig(
		{
			pkg: grunt.file.readJSON("package.json"),
			
			jshint:
			{
				BaseObject:
				{
					options: {},
					src: ["Components/BaseObject/BaseObject.js"]
				},

				ConcertJS:
				{
					options: {},
					src: ["ConcertJS/Source/Concert.js"]
				},

				ConcertJSmin:
				{
					options: {},
					src: ["Build/Concert.min.js"]
				}
			},

			uglify:
			{
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

				MinMax:
				{
					options: { beautify: true },
					src: ["Build/Concert.min.js"],
					dest: "Build/Concert.min.max.js"
				}
			}
		});
	
	// Load the plugins
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	
	// Default task
	grunt.registerTask("default", ["uglify:ConcertJS"]);

	// Other tasks
	grunt.registerTask("minmax", ["uglify:ConcertJS", "uglify:MinMax"]);
};
