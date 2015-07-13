'use strict';
var util = require('util');
var path = require('path');
var chalk = require('chalk');
var yosay = require('yosay');
var yeoman = require('yeoman-generator');
var globule = require('globule');
var shelljs = require('shelljs');
var inquirer = require("inquirer");

var BriefsGenerator = module.exports = function BriefsGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  var dependenciesInstalled = ['bundle', 'ruby'].every(function (depend) {
    return shelljs.which(depend);
  });

  // Exit if Ruby dependencies aren't installed
  if (!dependenciesInstalled) {
    console.log('Looks like you\'re missing some dependencies.' +
      '\nMake sure ' + chalk.white('Ruby') + ' and the ' + chalk.white('Bundler gem') + ' are installed, then run again.');
    shelljs.exit(1);
  }

  this.gitInfo = {
    name: this.user.git.username,
    email: this.user.git.email
  }

  this.on('end', function () {
    this.installDependencies({ skipInstall: options['skip-install'] });
  });

  this.appName = path.basename(process.cwd());
  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(BriefsGenerator, yeoman.generators.Base);

BriefsGenerator.prototype.askForUser = function askForUser() {
  var cb = this.async();
  var prompts = [
    {
      name: 'authorName',
      message: 'What name should I write on the tag?',
      default: this.gitInfo.name
    },
    {
      name: 'authorEmail',
      message: 'What email should I use to contact you if I find your briefs?',
      default: this.gitInfo.email
    }
  ];

  console.log(yosay('' + chalk.cyan('Briefs (brēfs)') + '\n1. close-fitting legless underpants that are cut so as to cover the body to the waist, in contrast to a bikini.  2. Undergarments for your project.'));
  console.log(chalk.yellow('Color.  Size.  Pattern.  Tell me how you like your briefs') + ' →');

  this.prompt(prompts, function (props) {

    this.authorName  = props.authorName;
    this.authorEmail = props.authorEmail;

    cb();
  }.bind(this));
};

BriefsGenerator.prototype.askForTools = function askForTools() {
  var cb = this.async();
  var prompts = [
    {
      name: 'jsPre',
      type: 'list',
      message: 'JavaScript preproccesor',
      choices: ['None', 'CoffeeScript']
    },
    {
      name: 'sassComp',
      type: 'list',
      message: 'Sass compiler',
      choices: ['Ruby', 'LibSass']
    },
    {
      name: 'googleAnalytics',
      type: 'confirm',
      message: 'Include Google Analytics?',
      default: false
    }
  ]

  console.log(chalk.yellow('\nPreprocessors and tools.') + ' →');

  this.prompt(prompts, function (props) {
    this.googleAnalytics = props.googleAnalytics;

    // Multiple choice 'None' to false
    this.jsPre = props.jsPre === 'None' ? false : props.jsPre.toLowerCase();

    // Lowercase sassComp variable
    this.sassComp = props.sassComp.toLowerCase();

    cb();
  }.bind(this));
};

BriefsGenerator.prototype.askForMixins = function askForMixins() {
  var cb = this.async();
  var prompts = [
    {
      type: "confirm",
      name: "bourbon",
      message: "Include Bourbon?",
      default: false
    },
    {
      type: "confirm",
      name: "neat",
      message: "Include Neat?",
      when: function ( answers ) {
        return answers.bourbon;
      }
    },
    // {
    //   type: "confirm",
    //   name: "barspoon",
    //   message: "Include BarSpoon (Bootstrap-style Neat grid helpers)?",
    //   when: function ( answers ) {
    //     return answers.neat;
    //   }
    // }
  ]

  console.log(chalk.yellow('\nMixin Libraries.') + ' →');

  this.prompt(prompts, function (props) {
    this.bourbon = props.bourbon;
    this.neat = props.neat;
    // this.barspoon = props.barspoon;

    cb();
  }.bind(this));
};

BriefsGenerator.prototype.askForUI = function askForUI() {
  var cb = this.async();
  var prompts = [
    {
      name: 'ui',
      type: 'list',
      message: 'What UI Framework would you like to use?',
      choices: ['None', 'Bootstrap', 'Foundation', 'Materialize']
    }
  ]

  console.log(chalk.yellow('\nFront-end Frameworks.') + ' →');

  this.prompt(prompts, function (props) {

    this.ui = props.ui === 'None' ? false : props.ui.toLowerCase();

    cb();
  }.bind(this));
};

BriefsGenerator.prototype.askForDeployment = function askForDeployment() {
  var cb = this.async();
  var prompts = [
    {
      name: 'deploy',
      message: 'Use grunt-build-control for deployment?',
      type: 'confirm',
      default: false
    },
    {
      name: 'deployHost',
      type: 'list',
      message: 'Host to deploy to',
      choices: ['GitHub Pages', 'Generic remote'],
      when: function (answers) {
        return answers.deploy;
      }
    },
    {
      name: 'ghOwner',
      message: 'GitHub repository owner',
      when: function (answers) {
        return answers.deployHost === 'GitHub Pages';
      }
    },
    {
      name: 'ghRepo',
      message: 'GitHub repository name',
      when: function (answers) {
        return answers.deployHost === 'GitHub Pages';
      }
    },
    {
      name: 'ghPagesProject',
      type: 'list',
      message: 'GitHub Project or User/Organization site?',
      choices: ['Project', 'User/Organization'],
      when: function(answers) {
        return answers.deployHost == 'GitHub Pages';
      }
    },
    {
      name: 'remoteURL',
      message: 'Remote URL',
      when: function (answers) {
        return answers.deployHost === 'Generic remote';
      }
    },
    {
      name: 'deployBranch',
      message: 'Branch to deploy to',
      default: function(answers) {
        if (answers.ghPagesProject === 'Project') {
          return 'gh-pages';
        } else if (answers.ghPagesProject === 'User/Organization') {
          return 'master';
        } else {
          return 'dist';
        }
      },
      when: function (answers) {
        return answers.deploy;
      }
    }
  ]

  console.log(chalk.yellow('\nDeployment options.') + ' →');

  this.prompt(prompts, function (props) {

    this.deploy         = props.deploy;
    this.deployHost     = props.deployHost;
    this.ghOwner        = props.ghOwner;
    this.ghRepo         = props.ghRepo;
    this.deployBranch   = props.deployBranch;

    if (props.ghPagesProject) {
      this.ghPagesProject = props.ghPagesProject.replace('/', '_').toLowerCase();
    }

    if (this.deployHost === 'GitHub Pages') {
      this.deployRemote = 'git@github.com:' + this.ghOwner + '/' + this.ghRepo + '.git';
    } else {
      this.deployRemote = props.remoteURL;
    }

    cb();
  }.bind(this));
};

BriefsGenerator.prototype.rubyDependencies = function rubyDependencies() {
  this.template('Gemfile');
  this.conflicter.resolve(function (err) {
    if (err) {
      return this.emit('error', err);
    }
    shelljs.exec('bundle install');
  });
};

BriefsGenerator.prototype.app = function app() {
  this.directory('app', 'app');
  this.copy('Gemfile', 'Gemfile');
  this.copy('bowerrc', '.bowerrc');
  this.copy('csslintrc', '.csslintrc');
  this.copy('gitignore', '.gitignore');
  this.template('_Gruntfile.js', 'Gruntfile.js');
  this.template('config.yml', '_config.yml');
  this.template('_config.build.yml', '_config.build.yml');
  this.template('_package.json', 'package.json');
  this.template('_bower.json', 'bower.json');
  this.template('_README.md', 'README.md');
};

BriefsGenerator.prototype.projectfiles = function projectfiles() {
  this.copy('editorconfig', '.editorconfig');
  this.copy('jshintrc', '.jshintrc');
};

BriefsGenerator.prototype.templates = function templates() {
  this.template('conditional/template/default.html', 'app/_layouts/default.html');
  this.template('conditional/template/index.html', 'app/index.html');

  if (this.googleAnalytics) {
    this.copy('conditional/template/google-analytics.html', 'app/_includes/shared/google-analytics.html');
  };
};

BriefsGenerator.prototype.jsPreprocessor = function jsPreprocessor() {
  if (this.jsPre === 'coffeescript') {
    this.copy('conditional/coffee/app.coffee', 'app/scripts/app.coffee');
  } else {
    this.copy('conditional/javascript/app.js', 'app/scripts/app.js');
  }
};

// BriefsGenerator.prototype.mixinLibraries = function mixinLibraries() {
//   if (this.barspoon) {
//     this.directory('conditional/codefashioned', 'vendor/codefashioned');
//   }
// };
