"""Independent numerical spot checks of the authored equations; no app dependencies."""
import math,json
c,s=math.cos,math.sin

def fk(a,b,L=1,K=1):return (L*c(a)+K*c(a+b),L*s(a)+K*s(a+b))
def jac(a,b,L=1,K=1):return [[-L*s(a)-K*s(a+b),-K*s(a+b)],[L*c(a)+K*c(a+b),K*c(a+b)]]
def close(a,b,t=1e-7):assert abs(a-b)<t,(a,b)
# Known FK and both regular IK branches
for a,b in [(0,math.pi/2),(math.pi/2,-math.pi/2)]:
 for x,y in zip(fk(a,b),(1,1)):close(x,y)
for x,y in [(1,1),(.4,1.2),(-.8,.6)]:
 z=(x*x+y*y-2)/2
 for b in [math.acos(z),-math.acos(z)]:
  a=math.atan2(y,x)-math.atan2(s(b),1+c(b))
  for u,v in zip(fk(a,b),(x,y)):close(u,v)
# Derivative check at several regular configurations
for a,b in [(.2,.7),(-.6,1.1),(1.2,-.4)]:
 J=jac(a,b);h=1e-6
 for col in range(2):
  plus=fk(a+(h if col==0 else 0),b+(h if col==1 else 0));minus=fk(a-(h if col==0 else 0),b-(h if col==1 else 0))
  for row in range(2):close((plus[row]-minus[row])/(2*h),J[row][col])
 close(J[0][0]*J[1][1]-J[0][1]*J[1][0],s(b))
# Rigid point transformation and correct inverse translation
angle=.7;R=[[c(angle),-s(angle)],[s(angle),c(angle)]];t=[2,-1];q=[.3,.8]
y=[sum(R[i][j]*q[j] for j in range(2))+t[i] for i in range(2)]
x=[sum(R[j][i]*(y[j]-t[j]) for j in range(2)) for i in range(2)]
for a,b in zip(x,q):close(a,b)
J=jac(0,0);close(J[0][0],0);close(J[0][1],0)
print(json.dumps({'status':'passed','checks':['known forward poses','both regular inverse branches at three targets','Jacobian central-difference checks','determinant identity','rigid-transform inverse round trip','full-extension radial velocity restriction'],'notVerified':['application integration','general spatial kinematics','robot hardware behavior']}))
