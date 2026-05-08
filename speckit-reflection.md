# SpecKit Lab Reflection

In this lab, I experienced the SpecKit framework and compared it with a more direct vibe coding approach. In vibe coding, the process feels faster at the beginning because I can ask the AI to generate code immediately. However, it can also become unclear because requirements, assumptions, and technical decisions may stay inside the chat instead of being documented.

SpecKit felt more structured and controlled. The workflow forced me to define the project constitution first, then create a feature specification, clarify ambiguities, review the checklist, generate a technical plan, and finally create implementation tasks. This made the development process easier to follow because every step had a clear purpose.

The clarify step was especially useful. It identified missing decisions such as refresh token behavior, concurrent sessions, email service failure handling, brute force protection, and account deletion rules. These questions made the specification more precise before planning. Because of this, the plan and tasks were more reliable.

Compared with vibe coding, SpecKit was slower at the beginning, but it gave better control and traceability. The generated files such as spec.md, plan.md, tasks.md, data-model.md, and contracts made the work persistent and version-controlled. This is better for real projects because the team can review and understand the reasoning behind the implementation.

I also noticed that conversation compaction can affect context quality. If too much information stays only in the chat, the AI may lose some details later. SpecKit helps reduce this problem by saving important decisions into project files. Overall, I think SpecKit is better for production-style development, while vibe coding is better for quick prototypes. 