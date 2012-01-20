#!/usr/bin/env python2

import sys
from l20n.format.lol import ast
from l20n.format.lol.serializer import Serializer
from BeautifulSoup import BeautifulSoup

ATTRS = (
    'id',
    'l10n-id',
    'class',
    'style',
    'href',
)

isloc = lambda attr: attr[0] not in ATTRS

def extract(node):
    id = node['l10n-id']
    attrs = filter(isloc, node.attrs)
    for child in node.findAll():
        child.attrs = filter(isloc, child.attrs)
    value = node.renderContents()
    return id, value, attrs

if __name__ == '__main__':
    f = open(sys.argv[1], 'r')
    dom = BeautifulSoup(f)
    nodes = dom.findAll(True, {'l10n-id': True})
    lol = ast.LOL()
    for node in nodes:
        id, value, attrs = extract(node)
        entity = ast.Entity(id, None, value, attrs)
        lol.body.append(entity)
    print Serializer.dump_l_o_l(lol)
