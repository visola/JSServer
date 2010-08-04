var page = html.html();

page.append(html.head(html.title('Teste')));

var b = html.body();
page.append(b);

b.append(html.p('This is some content.'));
b.append(html.p(path.root('test.js')));
b.append(html.p(path.app('template/test.js')));
b.append(html.p(path.controller('test.js')));

processor.runScript(path.app('template/test.js'), this);

response.writer.print(page.render());