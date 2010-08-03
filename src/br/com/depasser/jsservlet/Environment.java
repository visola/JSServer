/*
 * Copyright by Vinicius Isola, 2010
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */
package br.com.depasser.jsservlet;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Environment extends Properties {

	public class Application {

		private File directory, boot, config, error, controller, model, view, resource;

		public Application(File directory) {
			logger.info("Configuring application...");

			this.directory = directory;
			logger.debug("Application directory: " + this.directory.getAbsolutePath());

			config = new File(directory, getProperty(PROPERTY.APP_CONFIG_DIR, "config"));

			// Load application properties
			try {
				File propsFile = new File(config, getProperty(PROPERTY.APP_CONFIG_FILE));
				if (propsFile.exists()) {
					load(new FileInputStream(propsFile));
				}
			} catch (IOException ioe) {
				logger.error("Could not load application properties.", ioe);
			}

			// If debug is enabled, show application properties
			if (logger.isDebugEnabled()) {
				logger.debug("All properties: ");
				for (Map.Entry<Object, Object> entry : entrySet()) {
					logger.debug("\t" + entry.getKey() + " = " + entry.getValue());
				}
			}

			// Create other directory references
			boot = new File(directory, "boot");
			controller = new File(directory, getProperty(PROPERTY.APP_CONTROLLER_DIR));
			logger.debug("Controller directory: " + controller.getAbsolutePath());

			error = new File(directory, getProperty(PROPERTY.APP_ERROR_DIR));
			logger.debug("Error directory: " + error.getAbsolutePath());

			model = new File(directory, getProperty(PROPERTY.APP_MODEL_DIR));
			logger.debug("Model directory: " + model.getAbsolutePath());

			view = new File(directory, getProperty(PROPERTY.APP_VIEW_DIR));
			logger.debug("View directory: " + view.getAbsolutePath());

			resource = new File(directory, getProperty(PROPERTY.APP_RESOURCE_DIR));
			logger.debug("Resource directory: " + resource.getAbsolutePath());

			logger.info("Application configured.");
		}

		public File getBoot() {
			return boot;
		}

		public File getController() {
			return controller;
		}

		public File getDirectory() {
			return directory;
		}

		public File getError() {
			return error;
		}

		public File getModel() {
			return model;
		}

		public File getResource() {
			return resource;
		}

		public File getView() {
			return view;
		}

	}

	public enum PROPERTY {
			APP_DEFAULT_CONTROLLER("application.controller.default"),
			APP_CONFIG_FILE("application.config.file"),
			APP_PATH("application.path"),
			APP_WELCOME_FILES("application.welcome"),

			APP_DIR("application.directory"),
			APP_CONFIG_DIR("application.config.directory"),
			APP_CONTROLLER_DIR("application.controller.directory"),
			APP_ERROR_DIR("application.error.directory"),
			APP_MODEL_DIR("application.model.directory"),
			APP_VIEW_DIR("application.view.directory"),
			APP_RESOURCE_DIR("application.resource.directory"),

			APP_ENCODING("application.encoding"),

			SERVER_DIR("server.directory"),
			SERVER_PATH("server.path"),
			SERVER_PORT("server.port"),
			SERVER_CONTEXT_ROOT("server.context.root"),

			EXTENSION_JSP("resource.jsp.extension"),
			EXTENSION_RESOURCE("resource.extension"),

			JSSERVLET_EXTENSION("servlet.extension"),
			JSSERVLET_ROOT("servlet.root"),

			TIMER_USER("timer.use"),

			SHUTDOWN_PASSWORD("server.shutdown.password"),
			SHUTDOWN_PORT("server.shutdown.port"),
			SHUTDOWN_REMOTE("server.shutdown.remote"),
			SHUTDOWN_USE("server.shutdown.use")
		;

		public final String value;
		private PROPERTY (String value) {
			this.value = value;
		}
	}

	public class Server {

		private File directory, error;
		private boolean embedded = false;

		public Server(File directory) {
			logger.info("Loading server properties...");

			this.directory = directory;
			logger.debug("Server directory: " + this.directory.getAbsolutePath());

			// Load server properties
			try {
				load(new FileInputStream(new File(directory, "config/server.properties")));
			} catch (IOException ioe) {
				logger.error("Error loading server properties.", ioe);
				return;
			}

			// Show properties if debug is enabled
			if (logger.isDebugEnabled()) {
				logger.debug("Server properties: ");
				for (Map.Entry<Object, Object> entry : entrySet()) {
					logger.debug("\t" + entry.getKey() + " = " + entry.getValue());
				}
			}

			// Server configuratio finished
			logger.info("Server configuration ready.");

			// Load application default configuration
			logger.debug("Loading default application properties.");
			try {
				File defaultProps = new File(directory, "config/default.properties");
				if (defaultProps.exists() && defaultProps.isFile()) {
					load(new FileInputStream(defaultProps));
				}
			} catch (IOException ioe) {
				logger.error("Error while loading default application properties.", ioe);
			}

			error = new File(directory, "error");
		}

		public File getDirectory() {
			return directory;
		}

		public File getError() {
			return error;
		}

		public boolean isEmbedded() {
			return embedded;
		}

		public void setEmbedded(boolean embedded) {
			this.embedded = embedded;
		}


	}

	private static final long serialVersionUID = -7846288295018844222L;

	public Application application;

	private Logger logger = LoggerFactory.getLogger(Environment.class);

	public Server server;

	public Environment(File serverDirectory, File applicationDirectory) {
		if (serverDirectory == null || applicationDirectory == null) {
			logger.error("Server or Application directory not correctly set.");
			throw new NullPointerException("Server and Application directory must be specified.");
		}

		server = new Server(serverDirectory);
		application = new Application(applicationDirectory);

		logger.debug("Processing properties...");

		Map<String, String> newValues = new HashMap<String, String>();
		newValues.put("serverDir", serverDirectory.getAbsolutePath());
		newValues.put("appDir", applicationDirectory.getAbsolutePath());

		processProperties(newValues);
	}

	public Object get(PROPERTY prop) {
		return this.get(prop.value);
	}

	public String getProperty(PROPERTY prop) {
		return this.getProperty(prop.value);
	}

	public String getProperty(PROPERTY prop, String defaultValue) {
		return this.getProperty(prop.value, defaultValue);
	}

	private void processProperties(Map<String, String> newValues) {
		for (Entry<Object, Object> entry : entrySet()) {
			String name = (String) entry.getKey();
			String value = (String) entry.getValue();

			for (Entry<String, String> newValue : newValues.entrySet()) {
				value = value.replace("${" + newValue.getKey() + "}", newValue.getValue());
			}

			setProperty(name, value);
		}
	}

}