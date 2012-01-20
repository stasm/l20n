import sys
import re
from textwrap import dedent

from l20n.format.lol import ast

if sys.version >= "3":
    basestring = str

def is_string(string):
    return isinstance(string, basestring)

pattern = re.compile("([A-Z])")
unescaped_quote = re.compile(r'(?<!\\)"')

def obj2methodname(obj):
    cname = obj.__class__.__name__
    chunks = pattern.split(cname)
    for i,chunk in enumerate(chunks):
        if i%2:
            chunks[i] = '_%s' % chunk.lower()
    return 'dump%s' % (''.join(chunks))

class SerializerError(Exception):
    pass

class Serializer():
    @classmethod
    def serialize(cls, lol):
        if not hasattr(lol, '_template'):
            setattr(ast.Node, '_serializer', cls)
        string = str(lol)
        return string

    @classmethod
    def dump(cls, node):
        name = obj2methodname(node)
        try:
            method = getattr(cls, name)
            return method(node)
        except AttributeError:
            print(type(node))
            raise SerializerError('Unknown node')

    @classmethod
    def dump_l_o_l(cls, lol):
        return '\n'.join([cls.dump(elem) for elem in lol.body])

    @classmethod
    def dump_entity(cls, entity):
        index = "[%(index)s]" % entity if entity.index else ""
        attrs = cls.dump_attrs(entity.attrs)
        value = cls.dump_value(entity.value)
        template = "<%(id)s%(index)s%(value)s%(attrs)s>"
        return template % {'id': entity.id,
                           'index': index,
                           'value': value,
                           'attrs': attrs}

    @classmethod
    def dump_value(cls, value):
        if not value:
            return " "
        quote = '"""' if unescaped_quote.search(value) else '"'
        value = dedent(value)
        valuelines = map(lambda p: '  %s' % p, value.splitlines())
        return ' %s%s\n%s' % (quote, '\n'.join(valuelines), quote)

    @classmethod
    def dump_attrs(cls, attrs):
        attrs = map(lambda a: '\n  %s: "%s"' % a, attrs)
        return ''.join(attrs)

    @classmethod
    def dump_comment(cls, comment):
        return '/*%(content)s*/' % comment

    @classmethod
    def dump_macro(cls, macro):
        idlist = "(%s)" % ', '.join([str(arg) for arg in macro.args])
        attrs = ""
        value = " {%(expression)s}" % macro
        return "<%(id)s%(idlist)s%(value)s%(attrs)s>" % {'id': macro.id,
                                                        'idlist': idlist,
                                                        'value': value,
                                                        'attrs': attrs}

    @classmethod
    def dump_prefix_expression(cls, exp):
        return "%(left)s %(operator)s %(right)s" % exp

    dump_binary_expression = dump_prefix_expression
    dump_logical_expression = dump_prefix_expression

    @classmethod
    def dump_postfix_expression(cls, exp):
        return "%(operator)s%(argument)s" % exp

    dump_unary_expression = dump_postfix_expression

    @classmethod
    def dump_parenthesis_expression(cls, exp):
        return "(%(expression)s)" % exp

    @classmethod
    def dump_operator(cls, op):
        return "%(token)s" % op

    dump_binary_operator = dump_operator
    dump_unary_operator = dump_operator
