<<<<<<< HEAD
### Set up Nitrous.IO Node.js Box
1. If you have a Python Box, terminate it, OR create another Nitrous.IO account for Node.js
2. Follow the [SSH Lab](https://docs.google.com/a/smu.edu.sg/document/d/15_1Ic9ysOgr2ZHWVKbEZEm2cGMXDtniYka2YY0IfZQ0) to create an SSH key pair for this box


### Clone and Configure GameBots Demo App

1. Clone this repository `cd ~/ && git clone https://github.com/andrewbeng89/gamebots.git -b master`
2. `cd gamebots`
3. Reomve the .git directory `rm -rf .git`
4. Create a new GitHub repository with your account
5. Initialise the demo app as a git repo in Nitrous.IO `git init`
6. Add the remote to the newly create GitHub repository `git remote add origin git@github.com:<your_username>/<your_new_repo>.git`
7. Run the GameBots app in the Nitrous.IO environment: `node app`


### Using the Elastic Beanstalk Command Line Interface Tools

1. Sign up for Elastic Beanstalk, make sure you have created an [AWS Secret Key](https://console.aws.amazon.com/iam/home?#security_credential)
2. From the Nitrous.IO terminal, navigate to "home": `cd ~/`
3. Download the modified version of the EB CLI Tools from the Nitrous.IO terminal: `wget https://dl.dropboxusercontent.com/u/6484381/AWS-ElasticBeanstalk-CLI-2.6.0.zip`
4. Unzip: `unzip AWS-ElasticBeanstalk-CLI-2.6.0.zip`
5. Edit the `.bashrc` file using the IDE to add the PATH for the EB tools to the end of the file: `export PATH=$PATH:$PWD/AWS-ElasticBeanstalk-CLI-2.6.0/eb/linux/python2.7`
6. `source .bashrc` to refresh bash.
7. Navigate to application folder: `cd gamebots`
8. Initialise a new EB application: `eb init`
9. When prompted, enter your AWS Access Key ID and Secret respectively
10. Select `Asia Pacific (Singapore)` when prompted for the region
11. Enter an application name: `<yourname>-gamebots`
12. Use this application name for environment name as well
13. Select `WebServer::Standard::1.0` when promted for environment tier
14. Select option 12 for "solution stack" (64bit Amazon Linux 2014.02 running Node.js)
15. Select single or load balanced environment type
16. Do not create an RDS DB instance
17. Start the environment: `eb start`
18. `git add -A .`
19. `git commit -a -m "creating new gamebots project"`
20. `git push origin master && git aws.push`
21. Visit the [Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk/home?region=ap-southeast-1#/applications?applicationNameFilter=) to view your application's build status


### Additional tutorials

For for information on application development in the Cloud, including AngularJS, MongoDB and creating JSON APIs with Node.JS, please refer to [this](https://github.com/andrewbeng89/mitb_node_demo#part-3-application-development-in-the-cloud) repository.


### View the GameBots demo app [here](http://gamebots-env-hrrxxujvrm.elasticbeanstalk.com/index.html)
=======
connectfour
===========

connectfour app for cloud computing
>>>>>>> bae63ab12ea3574eec01f70fb173198501f6e678
