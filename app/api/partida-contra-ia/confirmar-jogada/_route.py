import sys

content = open('/dev/stdin', 'r').read()
with open('app/api/partida-contra-ia/confirmar-jogada/route.ts', 'w', newline='\n') as f:
    f.write(content)
print('Written, size:', len(content))
