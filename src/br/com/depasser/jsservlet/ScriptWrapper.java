package br.com.depasser.jsservlet;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * <p>
 * Wraps a script file.
 * </p>
 *  
 * @author Vinicius Isola
 */
public class ScriptWrapper implements Script {
	
	/**
	 * SLF4J logger.
	 */
	private Logger logger = LoggerFactory.getLogger(ScriptWrapper.class);
	
	/**
	 * Wrapped script.
	 */
	protected Script script;
	
	/**
	 * Last time the file was modified.
	 */
	protected long lastModified = -1;
	
	/**
	 * Javascript file.
	 */
	protected final File file;
	
	/**
	 * Create a new wrapper associated with the specified file.
	 * 
	 * @param file
	 *            Javascript file.
	 */
	public ScriptWrapper(File file) {
		this.file = file;
	}

	/**
	 * Store the last modified date when the file was last compiled.
	 * 
	 * @return Last modified date when the file was compiled for the last time
	 */
	public long getLastModified() {
		return lastModified;
	}

	/**
	 * Return the wrapped script.
	 * 
	 * @return Wrapped script.
	 */
	public Script getScript() {
		return script;
	}
	
	/**
	 * <p>
	 * If the script is not compiled then, compile it and execute. If the file
	 * was modified after the last compilation, the script will be recompiled.
	 * </p>
	 * 
	 * @param context
	 *            Context to use.
	 * @param scope
	 *            Scope to use.
	 * @return The result of executing the script.
	 */
	@Override
	public Object exec(Context context, Scriptable scope) {
		// Check if it was updated
		if (file.lastModified() > getLastModified()) {
			logger.debug("Script changed: {}, recompiling it...", file.getName());

			// Recompile it
			try {
				compile(context);
			} catch (IOException ioe) {
				new RuntimeException("Error while compiling script.", ioe);
			}
		}
		
		return this.script.exec(context, scope);
	}
	
	/**
	 * Read the script file from disc and return its content.
	 * 
	 * @param scriptFile
	 *            File to read content from.
	 * @return The file content.
	 * @throws IOException
	 *             If an error occur while reading the file.
	 */
	protected String readScriptFile(File scriptFile) throws IOException {
		BufferedReader in = null;
		try {
			in = new BufferedReader(new InputStreamReader(new FileInputStream(scriptFile)));
			StringBuilder buffer = new StringBuilder();
			String line = null;
			while ( (line = in.readLine()) != null) {
				buffer.append(line);
				buffer.append("\n");
			}
			return buffer.toString();
		} catch (IOException ioe) {
			throw ioe;
		} finally {
			if (in != null) {
				in.close();
			}
		}
	}

	/**
	 * Compile the content from {@link #file} to {@link #script} and update
	 * {@link #lastModified}.
	 * 
	 * @param context
	 *            Context to use.
	 * @throws IOException
	 *             If an error occur while reading the file.
	 */
	protected void compile(Context context) throws IOException {
		String scriptContent = readScriptFile(file);
		this.script = context.compileString(scriptContent, file.getName(), 1, null);
		this.lastModified = file.lastModified();
	}

}
