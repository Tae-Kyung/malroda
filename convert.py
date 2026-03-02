import codecs

with codecs.open('c:\\Users\\misoh\\OneDrive\\Desktop\\workspace\\maloda\\herb5.txt', 'r', encoding='euc-kr', errors='replace') as infile:
    content = infile.read()

with codecs.open('c:\\Users\\misoh\\OneDrive\\Desktop\\workspace\\maloda\\herb5_utf8.txt', 'w', encoding='utf-8') as outfile:
    outfile.write(content)
